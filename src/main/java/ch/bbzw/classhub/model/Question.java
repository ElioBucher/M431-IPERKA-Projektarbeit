package ch.bbzw.classhub.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "question")
public class Question extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "module_id", nullable = false)
    public Long moduleId;

    @Column(nullable = false)
    public String question;

    @Column(name = "author_name")
    public String authorName;

    @Column(name = "created_at")
    public LocalDateTime createdAt = LocalDateTime.now();

    public static List<Question> findByModuleId(Long moduleId) {
        return list("moduleId", moduleId);
    }
}
