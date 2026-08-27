package com.weconnect.service;

import com.weconnect.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaStorageService {
    private static final Map<String, String> IMAGE_EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
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
}
