package com.weconnect.ai;

import com.weconnect.domain.translation.TranslationLanguage;

public interface TranslationProvider {
    TranslationResult translate(String content, TranslationLanguage sourceLanguage);

    TranslationResult detectAndTranslate(String content);

    record TranslationResult(
            String translatedContent,
            TranslationLanguage sourceLanguage,
            TranslationLanguage targetLanguage,
            String provider,
            String modelName
    ) {
    }
}
