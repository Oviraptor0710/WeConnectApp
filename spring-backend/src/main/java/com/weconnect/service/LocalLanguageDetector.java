package com.weconnect.service;

import com.weconnect.domain.translation.SourceLanguageDetection;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.regex.Pattern;

@Component
public class LocalLanguageDetector {
    private static final Pattern URL = Pattern.compile(
            "(?iu)\\b(?:https?://|www\\.)\\S+"
    );
    private static final Pattern EMAIL = Pattern.compile(
            "(?iu)\\b[\\p{L}\\p{N}._%+-]+@[\\p{L}\\p{N}.-]+\\.[\\p{L}]{2,}\\b"
    );
    private static final Pattern MENTION = Pattern.compile(
            "(?iu)(?<![\\p{L}\\p{N}_])@[\\p{L}\\p{N}_]+"
    );
    private static final String VIETNAMESE_SPECIFIC_CHARACTERS =
            "ÀÁẠẢÃĂẰẮẶẲẴÂẦẤẬẨẪÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ"
                    + "àáạảãăằắặẳẵâầấậẩẫèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡ"
                    + "ùúụủũưừứựửữỳýỵỷỹđ";

    public SourceLanguageDetection detect(String content) {
        String normalized = Normalizer.normalize(content == null ? "" : content, Normalizer.Form.NFC);
        String meaningfulCandidate = stripNonLinguisticTokens(normalized);
        if (!containsMeaningfulText(meaningfulCandidate)) {
            return SourceLanguageDetection.NOT_TRANSLATABLE;
        }

        boolean hasVietnameseSignal = meaningfulCandidate.codePoints()
                .anyMatch(codePoint -> VIETNAMESE_SPECIFIC_CHARACTERS.indexOf(codePoint) >= 0);
        boolean hasKana = meaningfulCandidate.codePoints().anyMatch(this::isKana);

        if (hasVietnameseSignal && !hasKana) return SourceLanguageDetection.VI;
        if (hasKana && !hasVietnameseSignal) return SourceLanguageDetection.JA;
        return SourceLanguageDetection.AMBIGUOUS;
    }

    boolean containsMeaningfulText(String content) {
        return content.codePoints().anyMatch(codePoint -> {
            Character.UnicodeScript script = Character.UnicodeScript.of(codePoint);
            return script == Character.UnicodeScript.LATIN
                    || script == Character.UnicodeScript.HIRAGANA
                    || script == Character.UnicodeScript.KATAKANA
                    || script == Character.UnicodeScript.HAN;
        });
    }

    private String stripNonLinguisticTokens(String content) {
        String withoutUrls = URL.matcher(content).replaceAll(" ");
        String withoutEmails = EMAIL.matcher(withoutUrls).replaceAll(" ");
        return MENTION.matcher(withoutEmails).replaceAll(" ");
    }

    private boolean isKana(int codePoint) {
        Character.UnicodeScript script = Character.UnicodeScript.of(codePoint);
        return script == Character.UnicodeScript.HIRAGANA
                || script == Character.UnicodeScript.KATAKANA;
    }
}
