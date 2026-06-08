INSERT INTO "cityProducer" ("idCity", "idResource", "quantity") VALUES
-- Grupo 1: Arcilla (id: 4) -> Q20
(2, 4, 20),

-- Grupo 2: Hierro (id: 9) -> Q10
(2, 9, 10),

-- Grupo 3: Madera (id: 17) -> Q7
(2, 17, 7),

-- Grupo 4: Grano (id: 19) -> Q5
(2, 19, 5),

-- Grupo 5: Vino (id: 27) -> Q4
(2, 27, 4),

-- Grupo 6: Cobre (id: 29) -> Q3
(2, 29, 3),

-- Grupo 7: Especias (id: 37) -> Q3
(2, 37, 3),

-- Grupo 8: Mármol (id: 40) -> Q3
(2, 40, 3),

-- Grupo 9: Oro (id: 44) -> Q2
(2, 44, 2)
ON CONFLICT ("idCity", "idResource") 
DO UPDATE SET "quantity" = EXCLUDED."quantity";

INSERT INTO "cityConsumer" ("idCity", "idResource", "quantity") VALUES
-- Grupo 1: Hueso (id: 3) [Producía Arcilla] -> Q20
(2, 3, 20),

-- Grupo 2: Papiro (id: 10) [Producía Hierro] -> Q10
(2, 10, 10),

-- Grupo 3: Pescado (id: 14) [Producía Madera] -> Q7
(2, 14, 7),

-- Grupo 4: Aceite (id: 20) [Producía Grano] -> Q5
(2, 20, 5),

-- Grupo 5: Textiles (id: 26) [Producía Vino] -> Q4
(2, 26, 4),

-- Grupo 6: Plata (id: 31) [Producía Cobre] -> Q3
(2, 31, 3),

-- Grupo 7: Incienso (id: 34) [Producía Especias] -> Q3
(2, 34, 3),

-- Grupo 8: Tinte (id: 38) [Producía Mármol] -> Q3
(2, 38, 3),

-- Grupo 9: Seda (id: 47) [Producía Oro] -> Q2
(2, 47, 2)
ON CONFLICT ("idCity", "idResource") 
DO UPDATE SET "quantity" = EXCLUDED."quantity";
