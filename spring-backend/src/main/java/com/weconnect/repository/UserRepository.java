package com.weconnect.repository;

import com.weconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // JPA tự hiểu: SELECT * FROM USERS WHERE email = ?
    Optional<User> findByEmail(String email);

    // JPA tự hiểu: SELECT * FROM USERS WHERE phone_number = ?
    Optional<User> findByPhoneNumber(String phoneNumber);

    // JPA tự hiểu: SELECT * FROM USERS WHERE email = ? OR phone_number = ?
    // Dùng cho luồng đăng nhập (identifier có thể là email hoặc sđt)
    Optional<User> findByEmailOrPhoneNumber(String email, String phoneNumber);

    // JPA tự hiểu: SELECT EXISTS(SELECT 1 FROM USERS WHERE email = ?)
    // Dùng để kiểm tra email đã tồn tại khi đăng ký chưa
    boolean existsByEmail(String email);

    // JPA tự hiểu: SELECT EXISTS(SELECT 1 FROM USERS WHERE phone_number = ?)
    // Dùng để kiểm tra sđt đã tồn tại khi đăng ký chưa
    boolean existsByPhoneNumber(String phoneNumber);
}
