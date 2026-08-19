package com.weconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "USERS")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "phone_number", unique = true, length = 20)
    private String phoneNumber;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    // Cột bio là kiểu TEXT trong MySQL
    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 255)
    private String location;

    @Column(name = "japanese_level", length = 50)
    private String japaneseLevel;

    @Column(name = "job_title", length = 255)
    private String jobTitle;

    @Column(length = 255)
    private String education;

    @Column(name = "relationship_status", length = 50)
    private String relationshipStatus;

    @Column(name = "preferred_language", length = 10)
    private String preferredLanguage = "vi"; // Giá trị mặc định

    @Column(length = 20)
    private String role = "USER"; // Giá trị mặc định

    @Column(name = "is_verified")
    private Boolean isVerified = false; // Giá trị mặc định

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- Các hàm tự động cập nhật thời gian ---

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @OneToMany(mappedBy = "organizer")
    private List<Event> organizedEvents;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "USER_HOBBIES",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "hobby_id")
    )
    private List<Hobby> hobbies;
}
