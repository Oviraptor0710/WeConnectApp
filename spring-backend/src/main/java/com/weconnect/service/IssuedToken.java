package com.weconnect.service;

public record IssuedToken(String value, long maxAgeSeconds) {
}
