package com.weconnect.dto.user.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * DTO dạng PATCH cho endpoint PUT cũ. Tập providedFields giúp phân biệt:
 * client không gửi field và client chủ động gửi field với giá trị null.
 */
public class UpdateProfileRequest {
    private final Set<String> providedFields = new HashSet<>();

    private String fullName;

    @Size(max = 500, message = "Bio không được vượt quá 500 ký tự")
    private String bio;

    private String location;
    private String japaneseLevel;
    private String jobTitle;
    private String education;
    private String relationshipStatus;
    private String gender;
    private LocalDate dateOfBirth;
    private String phoneNumber;

    @JsonIgnore
    public boolean isProvided(String field) {
        return providedFields.contains(field);
    }

    public String getFullName() { return fullName; }
    public String getBio() { return bio; }
    public String getLocation() { return location; }
    public String getJapaneseLevel() { return japaneseLevel; }
    public String getJobTitle() { return jobTitle; }
    public String getEducation() { return education; }
    public String getRelationshipStatus() { return relationshipStatus; }
    public String getGender() { return gender; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getPhoneNumber() { return phoneNumber; }

    @JsonSetter("full_name")
    public void setFullName(String value) { fullName = value; providedFields.add("full_name"); }

    @JsonSetter("bio")
    public void setBio(String value) { bio = value; providedFields.add("bio"); }

    @JsonSetter("location")
    public void setLocation(String value) { location = value; providedFields.add("location"); }

    @JsonSetter("japanese_level")
    public void setJapaneseLevel(String value) { japaneseLevel = value; providedFields.add("japanese_level"); }

    @JsonSetter("job_title")
    public void setJobTitle(String value) { jobTitle = value; providedFields.add("job_title"); }

    @JsonSetter("education")
    public void setEducation(String value) { education = value; providedFields.add("education"); }

    @JsonSetter("relationship_status")
    public void setRelationshipStatus(String value) { relationshipStatus = value; providedFields.add("relationship_status"); }

    @JsonSetter("gender")
    public void setGender(String value) { gender = value; providedFields.add("gender"); }

    @JsonSetter("date_of_birth")
    public void setDateOfBirth(LocalDate value) { dateOfBirth = value; providedFields.add("date_of_birth"); }

    @JsonSetter("phone_number")
    public void setPhoneNumber(String value) { phoneNumber = value; providedFields.add("phone_number"); }
}
