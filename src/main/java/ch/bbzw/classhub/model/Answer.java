package ch.bbzw.classhub.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "answer")
public class Answer extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "question_id", nullable = false)
    public Long questionId;

    @Column(nullable = false)
    public String answer;

    @Column(name = "author_name")
    public String authorName;

    @Column(name = "created_at")
    public LocalDateTime createdAt = LocalDateTime.now();

    public static List<Answer> findByQuestionId(Long questionId) {
        return list("questionId", questionId);
    }
}
