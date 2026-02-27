package com.example.media_service.configs;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UploadConfig {
    @Value("${CLOUDINARY_NAME}")
    private String NAME;

    @Value("${CLOUDINARY_SECRET}")
    private String SECRET;

    @Value("${CLOUDINARY_API_KEY}")
    private String API_KEY;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name",NAME,
                "api_key",API_KEY,
                "api_secret",SECRET,
                "secure",true
        ));
    }
}
