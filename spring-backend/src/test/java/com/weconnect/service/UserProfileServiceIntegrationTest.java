package com.weconnect.service;

import com.weconnect.dto.user.response.SuggestionResponse;
import com.weconnect.dto.user.response.UserSearchResponse;
import com.weconnect.domain.friend.FriendshipStatus;
import com.weconnect.entity.Hobby;
import com.weconnect.entity.User;
import com.weconnect.repository.HobbyRepository;
import com.weconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserProfileServiceIntegrationTest {
    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HobbyRepository hobbyRepository;

    @Test
    void searchAndSuggestionsPreserveTheLegacyBehavior() {
        Hobby music = new Hobby();
        music.setName("Âm nhạc test");
        music.setCategory("Giải trí test");
        hobbyRepository.saveAndFlush(music);

        User me = verifiedUser("me.profile@test.local", "Tôi", "N3", "Hà Nội", List.of(music));
        User candidate = verifiedUser(
                "candidate.profile@test.local",
                "Nguyễn An",
                "N3",
                "Hà Nội",
                List.of(music)
        );

        UserSearchResponse search = userProfileService.searchUsers(
                me.getUserId(), "nguyễn", null, null, null, null,
                String.valueOf(music.getHobbyId()), null, 1, 20
        );

        assertThat(search.data()).extracting("userId").containsExactly(candidate.getUserId());
        assertThat(search.data().get(0).friendshipStatus()).isEqualTo(FriendshipStatus.NONE);
        assertThat(search.pagination().total()).isEqualTo(1);

        SuggestionResponse suggestions = userProfileService.getSuggestions(me.getUserId(), 10);
        assertThat(suggestions.warning()).isNull();
        assertThat(suggestions.data()).extracting("userId").contains(candidate.getUserId());
    }

    private User verifiedUser(
            String email,
            String fullName,
            String japaneseLevel,
            String location,
            List<Hobby> hobbies
    ) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("test-password-hash");
        user.setFullName(fullName);
        user.setJapaneseLevel(japaneseLevel);
        user.setLocation(location);
        user.setRole("USER");
        user.setIsVerified(true);
        user.setHobbies(new ArrayList<>(hobbies));
        return userRepository.saveAndFlush(user);
    }
}
