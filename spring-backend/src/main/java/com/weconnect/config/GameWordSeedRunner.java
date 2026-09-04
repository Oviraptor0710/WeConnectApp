package com.weconnect.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Seeds the Shiritori word bank from Spring-owned resources when a database
 * has not been seeded yet. Existing rows are preserved/updated by the SQL
 * files' idempotent ON DUPLICATE KEY clauses.
 */
@Component
public class GameWordSeedRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(GameWordSeedRunner.class);

    private final DataSource dataSource;

    public GameWordSeedRunner(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("SELECT COUNT(*) FROM GAME_WORDS");
             ResultSet result = statement.executeQuery()) {
            result.next();
            if (result.getLong(1) > 0) {
                log.debug("GAME_WORDS already contains data; skipping Shiritori seed");
                return;
            }
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể kiểm tra ngân hàng từ Shiritori", exception);
        }

        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("game/shiritori_words_seed.sql"));
        populator.addScript(new ClassPathResource("game/shiritori_words_n3.sql"));
        try {
            populator.execute(dataSource);
            log.info("Seeded Shiritori word bank from Spring resources");
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể nạp ngân hàng từ Shiritori", exception);
        }
    }
}
