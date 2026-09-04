package com.weconnect.domain.translation;

public enum SourceLanguageDetection {
    VI,
    JA,
    AMBIGUOUS,
    NOT_TRANSLATABLE;

    public TranslationLanguage asSupportedLanguage() {
        return switch (this) {
            case VI -> TranslationLanguage.VI;
            case JA -> TranslationLanguage.JA;
            case AMBIGUOUS, NOT_TRANSLATABLE -> throw new IllegalStateException(
                    "Kết quả nhận diện chưa xác định được ngôn ngữ nguồn"
            );
        };
    }
}
