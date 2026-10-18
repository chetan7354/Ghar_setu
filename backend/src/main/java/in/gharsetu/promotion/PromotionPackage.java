package in.gharsetu.promotion;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "promotion_packages")
@Getter
@Setter
public class PromotionPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String code;
    private String name;
    private int durationDays;
    private BigDecimal price;
    private boolean active;
}
