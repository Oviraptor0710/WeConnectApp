package com.weconnect.dto.auth.request;

import com.weconnect.entity.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendOtpRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    private OtpPurpose purpose = OtpPurpose.REGISTER;
}
