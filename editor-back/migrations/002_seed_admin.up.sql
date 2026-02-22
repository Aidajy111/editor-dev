-- Создаем дефолтного админа (если еще нет)
INSERT INTO users (email, password_hash, role)
VALUES (
           'aidasjy4.00@gmail.com',  -- поменяй на свой email
           '$2a$10$pYomFCu9okMCYASE5mclyONSv15lXrCIBUxgj5IKLYZwkEW3Z2tL6',
           'admin'
       ) ON CONFLICT (email) DO NOTHING;