package com.gamebox.dto;

import lombok.Data;

@Data
public class UpdateProfileDTO {
    private String nickname;
    private String bio;
    private String email;
    private String avatar;
}
