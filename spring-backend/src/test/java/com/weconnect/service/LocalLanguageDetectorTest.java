package com.weconnect.service;

import com.weconnect.domain.translation.SourceLanguageDetection;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LocalLanguageDetectorTest {
    private final LocalLanguageDetector detector = new LocalLanguageDetector();

    @Test
    void detectsVietnameseWhileTreatingEnglishWordsAsNeutral() {
        assertThat(detector.detect("Tôi có một option cho Spring Boot"))
                .isEqualTo(SourceLanguageDetection.VI);
        assertThat(detector.detect("@kien Đây là link https://example.com của tôi"))
                .isEqualTo(SourceLanguageDetection.VI);
    }

    @Test
    void detectsJapaneseWhileTreatingEnglishWordsAsNeutral() {
        assertThat(detector.detect("今日はmeetingです"))
                .isEqualTo(SourceLanguageDetection.JA);
        assertThat(detector.detect("Spring Bootを勉強しています"))
                .isEqualTo(SourceLanguageDetection.JA);
    }

    @Test
    void returnsAmbiguousForMixedOrSignalPoorMeaningfulText() {
        assertThat(detector.detect("Tôi thích日本語です"))
                .isEqualTo(SourceLanguageDetection.AMBIGUOUS);
        assertThat(detector.detect("xin chao"))
                .isEqualTo(SourceLanguageDetection.AMBIGUOUS);
        assertThat(detector.detect("漢字"))
                .isEqualTo(SourceLanguageDetection.AMBIGUOUS);
        assertThat(detector.detect("hello"))
                .isEqualTo(SourceLanguageDetection.AMBIGUOUS);
    }

    @Test
    void rejectsContentWithoutLinguisticTextAfterRemovingSpecialTokens() {
        assertThat(detector.detect("https://example.com user@example.com @friend 123 😊 !!!"))
                .isEqualTo(SourceLanguageDetection.NOT_TRANSLATABLE);
        assertThat(detector.detect("   "))
                .isEqualTo(SourceLanguageDetection.NOT_TRANSLATABLE);
    }
}
