package com.weconnect.service;

import com.weconnect.domain.chat.MessageType;
import com.weconnect.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaStorageService {
    private static final Map<String, String> IMAGE_EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );
    private static final Set<String> CHAT_FILE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain", "text/csv",
            "application/zip", "application/x-zip-compressed", "application/x-rar-compressed",
            "audio/mpeg", "audio/mp4", "audio/wav", "audio/webm",
            "video/mp4", "video/webm", "video/quicktime"
    );
    private static final Set<String> CHAT_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final Path uploadRoot;

    public MediaStorageService(@Value("${app.upload-dir:/app/uploads}") String uploadDir) {
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public String saveImage(MultipartFile file, String subfolder, int maxMegabytes) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("Vui lòng chọn file ảnh");
        }

        String extension = IMAGE_EXTENSIONS.get(file.getContentType());
        if (extension == null) {
            throw BusinessException.badRequest("Chỉ chấp nhận định dạng JPG, PNG, WebP");
        }

        long maxBytes = maxMegabytes * 1024L * 1024L;
        if (file.getSize() > maxBytes) {
            throw BusinessException.payloadTooLarge("File không được vượt quá " + maxMegabytes + "MB");
        }

        Path targetFolder = uploadRoot.resolve(subfolder).normalize();
        if (!targetFolder.startsWith(uploadRoot)) {
            throw BusinessException.badRequest("Thư mục upload không hợp lệ");
        }

        String filename = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        Path target = targetFolder.resolve(filename);

        try {
            Files.createDirectories(targetFolder);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể lưu file upload", exception);
        }

        return "/uploads/" + subfolder + "/" + filename;
    }

    public StoredChatFile saveChatFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("Vui lòng chọn file đính kèm");
        }

        String contentType = file.getContentType();
        if (contentType == null || !CHAT_FILE_TYPES.contains(contentType)) {
            throw BusinessException.badRequest("Định dạng file không được hỗ trợ");
        }
        int maxMegabytes = 50;
        if (file.getSize() > maxMegabytes * 1024L * 1024L) {
            throw BusinessException.payloadTooLarge("File không được vượt quá 50MB");
        }

        String safeOriginalName = safeFilename(file.getOriginalFilename());
        String storedFilename = UUID.randomUUID().toString().replace("-", "") + "-" + safeOriginalName;
        Path targetFolder = uploadRoot.resolve("chat").normalize();
        Path target = targetFolder.resolve(storedFilename).normalize();
        if (!target.startsWith(targetFolder)) {
            throw BusinessException.badRequest("Tên file không hợp lệ");
        }

        try {
            Files.createDirectories(targetFolder);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể lưu file chat", exception);
        }

        return new StoredChatFile(
                "/uploads/chat/" + storedFilename,
                CHAT_IMAGE_TYPES.contains(contentType) ? MessageType.IMAGE : MessageType.FILE
        );
    }

    public void deleteByUrl(String url) {
        if (url == null || !url.startsWith("/uploads/")) return;
        Path target = uploadRoot.resolve(url.substring("/uploads/".length())).normalize();
        if (!target.startsWith(uploadRoot)) return;
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // Cleanup best-effort; lỗi chính vẫn được xử lý bởi transaction gọi hàm này.
        }
    }

    private String safeFilename(String originalFilename) {
        String name = originalFilename == null ? "file.bin" : originalFilename;
        name = name.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1);
        name = name.replaceAll("[^\\p{L}\\p{N}._-]", "_");
        name = name.replaceAll("^[.]+", "");
        if (name.isBlank()) name = "file.bin";
        if (name.length() > 120) name = name.substring(name.length() - 120);
        return name;
    }

    public record StoredChatFile(String url, MessageType type) {
    }
}
