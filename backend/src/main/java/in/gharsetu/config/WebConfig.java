package in.gharsetu.config;

import in.gharsetu.storage.LocalDiskImageStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {
    private final ObjectProvider<LocalDiskImageStorage> localStorage;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        LocalDiskImageStorage local = localStorage.getIfAvailable();
        if (local != null) {
            registry.addResourceHandler("/uploads/properties/**")
                    .addResourceLocations(local.root().resolve("properties").toUri().toString() + "/");
        }
    }
}
