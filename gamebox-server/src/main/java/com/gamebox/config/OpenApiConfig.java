package com.gamebox.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI gameBoxOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("GameBox 游戏社区平台 API")
                        .description("仿小黑盒游戏社区平台后端接口文档，共 38 个 RESTful API 接口")
                        .version("1.0.0")
                        .contact(new Contact().name("GameBox Team").email("admin@gamebox.com")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer"))
                .schemaRequirement("Bearer",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("登录后获取的 JWT Token"));
    }
}
