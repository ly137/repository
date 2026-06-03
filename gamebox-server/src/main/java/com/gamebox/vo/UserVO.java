package com.gamebox.vo;

import lombok.Data;

@Data
public class UserVO {
    private Long id;
    private String username;
    private String nickname;
    private String avatar;
    private String bio;
    private String email;
    private Integer postCount;
    private Integer likeCount;
    private Integer followeeCount;
    private Integer followerCount;
    private Boolean followed;
}
