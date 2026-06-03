package com.gamebox.vo;

import lombok.Data;

import java.time.LocalDate;

@Data
public class GameVO {
    private Long id;
    private String name;
    private String cover;
    private String description;
    private String developer;
    private String publisher;
    private LocalDate releaseDate;
    private String platform;
    private String tags;
    private Double rating;
    private Integer ratingCount;
    private Integer isRecommend;
}
