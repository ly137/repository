package com.gamebox;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.gamebox.mapper")
public class GameBoxApplication {

    public static void main(String[] args) {
        SpringApplication.run(GameBoxApplication.class, args);
    }
}
