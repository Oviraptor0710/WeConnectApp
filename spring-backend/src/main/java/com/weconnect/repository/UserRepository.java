package com.weconnect.repository;

import com.weconnect.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByEmailOrPhoneNumber(String email, String phoneNumber);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);

    @EntityGraph(attributePaths = "hobbies")
    Optional<User> findWithHobbiesByUserId(Long userId);

    @EntityGraph(attributePaths = "hobbies")
    List<User> findAllByIsVerifiedTrueAndRoleOrderByFullNameAsc(String role);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select u from User u
            where u.userId in :userIds
            order by u.userId
            """)
    List<User> findAllByIdForUpdate(@Param("userIds") Collection<Long> userIds);

    @Query(
            value = """
                    select u from User u, Friendship f
                    where ((f.user1.userId = :userId and u.userId = f.user2.userId)
                        or (f.user2.userId = :userId and u.userId = f.user1.userId))
                      and (:keyword is null
                        or lower(u.fullName) like concat('%', lower(:keyword), '%'))
                    """,
            countQuery = """
                    select count(u) from User u, Friendship f
                    where ((f.user1.userId = :userId and u.userId = f.user2.userId)
                        or (f.user2.userId = :userId and u.userId = f.user1.userId))
                      and (:keyword is null
                        or lower(u.fullName) like concat('%', lower(:keyword), '%'))
                    """
    )
    Page<User> findFriends(
            @Param("userId") Long userId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
