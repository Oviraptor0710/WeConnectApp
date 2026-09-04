package com.weconnect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Static assets are owned by Spring; uploads remain on the shared volume. */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    private final String uploadDir;

    public StaticResourceConfig(@Value("${app.upload-dir:/app/uploads}") String uploadDir) {
        this.uploadDir = uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir)
                .setCachePeriod(3600);
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(86400);
    }
}
