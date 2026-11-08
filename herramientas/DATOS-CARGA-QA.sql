SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'Hcu008Db_QA'
  THROW 51000, 'Este script solo puede ejecutarse en Hcu008Db_QA.', 1;

BEGIN TRANSACTION;

DELETE FROM RegistrosAcceso;
DELETE FROM RegistrosAuditoria;
DELETE FROM Egresos;
DELETE FROM Evoluciones;
DELETE FROM Examenes;
DELETE FROM Prescripciones;
DELETE FROM Diagnosticos;
DELETE FROM EvaluacionesMedicas;
DELETE FROM Triajes;
DELETE FROM Atenciones;
DELETE FROM Pacientes;
DELETE FROM UsuariosSistema WHERE Correo LIKE N'doctorqa%@hcu008.local';

DECLARE @HashDoctor nvarchar(500) = (
  SELECT TOP (1) ClaveHash FROM UsuariosSistema WHERE Correo = N'doctor@hcu008.com'
);

IF @HashDoctor IS NULL
  THROW 51001, 'Primero debe iniciarse la API QA para crear el usuario doctor.', 1;

DECLARE @i int = 1;
WHILE @i <= 9
BEGIN
  INSERT INTO UsuariosSistema (Nombres, Apellidos, Correo, Rol, Activo, ClaveHash, FechaCreacion)
  VALUES (
    N'Doctor QA',
    CONCAT(N'Número ', RIGHT(CONCAT(N'0', @i), 2)),
    CONCAT(N'doctorqa', RIGHT(CONCAT(N'0', @i), 2), N'@hcu008.local'),
    N'Doctor', 1, @HashDoctor, SYSDATETIME()
  );
  SET @i += 1;
END;

SET @i = 1;
WHILE @i <= 100
BEGIN
  DECLARE @Numero nvarchar(3) = RIGHT(CONCAT(N'000', @i), 3);
  DECLARE @Cedula varchar(10) = CAST(2000000000 + @i AS varchar(10));
  DECLARE @CorreoDoctor nvarchar(160) = CASE
    WHEN (@i - 1) % 10 = 0 THEN N'doctor@hcu008.com'
    ELSE CONCAT(N'doctorqa', RIGHT(CONCAT(N'0', (@i - 1) % 10), 2), N'@hcu008.local')
  END;
  DECLARE @DoctorId int = (SELECT Id FROM UsuariosSistema WHERE Correo = @CorreoDoctor);

  INSERT INTO Pacientes
    (Cedula, Nombres, Apellidos, FechaNacimiento, Sexo, Telefono, Direccion, Provincia, Canton, Parroquia, RegistradoPorUsuarioId)
  VALUES
    (@Cedula, CONCAT(N'Paciente ', @Numero), N'Prueba QA', DATEADD(day, -(@i * 97 % 20000), CAST(GETDATE() AS date)),
     CASE WHEN @i % 2 = 0 THEN N'Femenino' ELSE N'Masculino' END,
     CONCAT(N'09', RIGHT(CONCAT(N'00000000', @i), 8)), N'Dirección ficticia para prueba de carga',
     N'Santa Elena', N'La Libertad', N'La Libertad', @DoctorId);

  DECLARE @PacienteId int = SCOPE_IDENTITY();

  INSERT INTO Atenciones
    (PacienteId, FechaIngreso, MotivoConsulta, MotivoConsultaOtro, EnfermedadActualBreve, Procedencia,
     CondicionLlegada, TieneAcompanante, NombreAcompanante, ParentescoAcompanante, TelefonoAcompanante,
     Estado, ResponsableUsuarioId)
  VALUES
    (@PacienteId, DATEADD(minute, -@i, SYSDATETIME()),
     CASE WHEN @i % 3 = 0 THEN N'Dolor abdominal' WHEN @i % 3 = 1 THEN N'Fiebre' ELSE N'Dolor torácico' END,
     NULL, N'Cuadro clínico ficticio generado exclusivamente para prueba de carga.', N'Domicilio',
     N'Estable', 0, NULL, NULL, NULL, N'Con egreso', @DoctorId);

  DECLARE @AtencionId int = SCOPE_IDENTITY();

  INSERT INTO Triajes
    (AtencionId, Prioridad, DiscriminadorClinico, EscalaDolor, FrecuenciaCardiaca, FrecuenciaRespiratoria,
     Temperatura, SaturacionOxigeno, GlicemiaCapilar, PresionSistolica, PresionDiastolica,
     PresionArterialMedia, PresionPulso, GlasgowOcular, GlasgowVerbal, GlasgowMotora, Glasgow,
     LlenadoCapilar, Pupilas, Peso, Talla, IndiceMasaCorporal, OxigenoSuplementario,
     AlergiaConocida, RiesgoCaida, Aislamiento, FechaRegistro)
  VALUES
    (@AtencionId,
     CASE @i % 5 WHEN 0 THEN N'Rojo' WHEN 1 THEN N'Naranja' WHEN 2 THEN N'Amarillo' WHEN 3 THEN N'Verde' ELSE N'Azul' END,
     N'Dolor', @i % 11, 65 + @i % 35, 14 + @i % 10, CAST(36.2 + (@i % 15) / 10.0 AS decimal(4,1)),
     92 + @i % 9, 80 + @i % 70, 105 + @i % 35, 60 + @i % 25, 85, 45,
     4, 5, 6, 15, N'Menor de 2 segundos', N'Isocóricas', 55 + @i % 35, 150 + @i % 35, 24,
     0, 0, 0, 0, DATEADD(minute, -@i + 2, SYSDATETIME()));

  INSERT INTO EvaluacionesMedicas
    (AtencionId, FechaRegistro, EnfermedadActualAmpliada, AntecedentesPersonales, EstadoGeneral,
     EstadoConciencia, Hidratacion, Coloracion, DolorActual, CabezaCuello, Torax, Cardiopulmonar,
     Abdomen, Extremidades, Neurologico, PielFaneras, AnalisisClinico, ProblemasActivos,
     RiesgoClinico, ConductaInicial, PlanMedico, DificultadRespiratoria, DolorToracico,
     DeficitNeurologico, SangradoActivo, Fiebre, Trauma, SospechaSepsis, RiesgoObstetrico,
     RiesgoQuirurgico, RequiereAislamiento)
  VALUES
    (@AtencionId, DATEADD(minute, -@i + 5, SYSDATETIME()),
     N'Evolución ficticia de síntomas durante varias horas, sin datos de una persona real.', N'Niega antecedentes relevantes.',
     N'Estable', N'Alerta', N'Hidratado', N'Normal', N'Dolor leve', N'Sin hallazgos relevantes',
     N'Expansión conservada', N'Ruidos cardíacos rítmicos', N'Blando, depresible', N'Sin edema',
     N'Sin déficit focal', N'Íntegra', N'Caso simulado compatible con condición clínica estable.',
     N'Dolor y malestar general', N'Bajo', N'Observación', N'Control clínico, hidratación y reevaluación.',
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

  INSERT INTO Diagnosticos
    (AtencionId, CodigoCie10, DescripcionCie10, TipoDiagnostico, Condicion, Observacion, FechaRegistro)
  VALUES
    (@AtencionId, N'R10.4', N'Otro dolor abdominal y el no especificado', N'Presuntivo', N'Principal',
     N'Registro ficticio para prueba QA.', DATEADD(minute, -@i + 8, SYSDATETIME()));

  INSERT INTO Prescripciones
    (AtencionId, Medicamento, Presentacion, Dosis, ViaAdministracion, Frecuencia, Duracion,
     Cantidad, Indicaciones, AdministrarAhora, EsUrgente, Estado, FechaRegistro)
  VALUES
    (@AtencionId, N'Paracetamol', N'Tableta 500 mg', N'500 mg', N'VO', N'Cada 8 horas', N'3 días',
     N'9 tabletas', N'Usar únicamente como dato ficticio de prueba.', 0, 0, N'Activa',
     DATEADD(minute, -@i + 10, SYSDATETIME()));

  INSERT INTO Examenes
    (AtencionId, TipoExamen, NombreExamen, Prioridad, IndicacionClinica, Observacion,
     RequiereAyuno, EsUrgente, Estado, ResultadoResumen, FechaSolicitud, FechaResultado)
  VALUES
    (@AtencionId, N'Laboratorio', N'Hemograma completo', N'Rutina',
     N'Evaluación ficticia de parámetros hematológicos para carga.', N'Dato simulado.',
     0, 0, N'Resultado disponible', N'Resultado simulado sin alteraciones relevantes.',
     DATEADD(minute, -@i + 12, SYSDATETIME()), DATEADD(minute, -@i + 25, SYSDATETIME()));

  INSERT INTO Evoluciones
    (AtencionId, TipoEvolucion, CondicionPaciente, Subjetivo, Objetivo, Analisis, [Plan],
     SignosVitalesResumen, RespuestaTratamiento, RequiereReevaluacion, EsCritica, Estado, FechaRegistro)
  VALUES
    (@AtencionId, N'Control', N'Estable', N'Refiere mejoría clínica.',
     N'Signos vitales dentro de parámetros esperados.', N'Evolución clínica ficticia favorable.',
     N'Continuar observación y medidas generales.', N'FC 78, FR 18, SatO2 97%',
     N'Respuesta favorable simulada.', 0, 0, N'Activa', DATEADD(minute, -@i + 30, SYSDATETIME()));

  INSERT INTO Egresos
    (AtencionId, TipoEgreso, CondicionEgreso, Destino, DiagnosticoEgreso, ResumenClinico,
     Indicaciones, SignosAlarma, TratamientoDomiciliario, Recomendaciones, Observacion,
     RequiereControl, RequiereReferencia, Estado, FechaEgreso)
  VALUES
    (@AtencionId, N'Alta con indicaciones', N'Mejorado', N'Domicilio',
     N'R10.4 - Dolor abdominal no especificado',
     N'Paciente ficticio con evolución simulada favorable durante observación.',
     N'Hidratación, reposo y control ambulatorio simulado.',
     N'Acudir si presenta dolor intenso, fiebre persistente o dificultad respiratoria.',
     N'Tratamiento ficticio indicado en la prescripción QA.', N'Control simulado en 48 horas.',
     N'Este registro no corresponde a una persona real.', 1, 0, N'Registrado',
     DATEADD(minute, -@i + 45, SYSDATETIME()));

  SET @i += 1;
END;

COMMIT TRANSACTION;

SELECT N'Pacientes' AS Modulo, COUNT(*) AS Registros FROM Pacientes
UNION ALL SELECT N'Atenciones', COUNT(*) FROM Atenciones
UNION ALL SELECT N'Triajes', COUNT(*) FROM Triajes
UNION ALL SELECT N'EvaluacionesMedicas', COUNT(*) FROM EvaluacionesMedicas
UNION ALL SELECT N'Diagnosticos', COUNT(*) FROM Diagnosticos
UNION ALL SELECT N'Prescripciones', COUNT(*) FROM Prescripciones
UNION ALL SELECT N'Examenes', COUNT(*) FROM Examenes
UNION ALL SELECT N'Evoluciones', COUNT(*) FROM Evoluciones
UNION ALL SELECT N'Egresos', COUNT(*) FROM Egresos;
