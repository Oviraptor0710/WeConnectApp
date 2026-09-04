package com.weconnect.ai;

import com.weconnect.domain.translation.TranslationLanguage;
import com.weconnect.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeminiTranslationProviderTest {
    @Test
    void missingConfigurationFailsBeforeAnyExternalRequest() {
        GeminiTranslationProvider provider = new GeminiTranslationProvider("", "", 1_000);

        assertThatThrownBy(() -> provider.translate("Xin chào", TranslationLanguage.JA))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE)
                );
    }
}
