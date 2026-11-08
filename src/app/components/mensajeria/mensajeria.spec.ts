import { Mensajeria } from './mensajeria';

describe('Mensajeria', () => {
  it('prepara un resumen breve con la información clínica importante', () => {
    const component = new Mensajeria({} as never, {} as never, {} as never);
    component.atencionActual = {
      id: 27,
      pacienteId: 4,
      paciente: {
        id: 4,
        cedula: '0912345678',
        nombres: 'Ana',
        apellidos: 'Torres',
        fechaNacimiento: '1990-01-15',
        sexo: 'Femenino'
      },
      fechaIngreso: '2026-09-27T10:30:00-05:00',
      motivoConsulta: 'Dolor abdominal',
      enfermedadActualBreve: 'Dolor de ocho horas de evolución.',
      procedencia: 'Domicilio',
      condicionLlegada: 'Ambulatorio',
      tieneAcompanante: false,
      estado: 'Con egreso',
      triaje: {
        atencionId: 27,
        prioridad: 'Naranja',
        escalaDolor: 7,
        presionSistolica: 118,
        presionDiastolica: 76,
        frecuenciaCardiaca: 92,
        saturacionOxigeno: 98,
        alergiaConocida: true,
        alergiaDescripcion: 'Penicilina',
        oxigenoSuplementario: false,
        riesgoCaida: false,
        aislamiento: false
      },
      evaluacionMedica: {
        atencionId: 27,
        estadoGeneral: 'Estable',
        estadoConciencia: 'Alerta',
        riesgoClinico: 'Moderado',
        dificultadRespiratoria: false,
        dolorToracico: false,
        deficitNeurologico: false,
        sangradoActivo: false,
        fiebre: false,
        trauma: false,
        sospechaSepsis: false,
        riesgoObstetrico: false,
        riesgoQuirurgico: false,
        requiereAislamiento: false
      },
      diagnosticos: [{
        atencionId: 27,
        codigoCie10: 'R10.4',
        descripcionCie10: 'Otros dolores abdominales',
        tipoDiagnostico: 'Definitivo',
        condicion: 'Principal'
      }],
      prescripciones: [{
        atencionId: 27,
        medicamento: 'Paracetamol',
        dosis: '1 g',
        viaAdministracion: 'VO',
        frecuencia: 'Cada 8 horas',
        duracion: '3 días',
        administrarAhora: false,
        esUrgente: false
      }],
      examenes: [{
        atencionId: 27,
        tipoExamen: 'Laboratorio',
        nombreExamen: 'Hemograma completo',
        prioridad: 'Urgente',
        indicacionClinica: 'Dolor abdominal',
        requiereAyuno: false,
        esUrgente: true,
        estado: 'Con resultado',
        resultadoResumen: 'Sin leucocitosis'
      }],
      evoluciones: [{
        atencionId: 27,
        tipoEvolucion: 'Reevaluación',
        condicionPaciente: 'Estable',
        objetivo: 'Dolor controlado',
        analisis: 'Evolución favorable.',
        plan: 'Alta con indicaciones.',
        requiereReevaluacion: false,
        esCritica: false,
        fechaRegistro: '2026-09-27T12:00:00-05:00'
      }],
      egreso: {
        atencionId: 27,
        tipoEgreso: 'Alta médica',
        condicionEgreso: 'Estable',
        destino: 'Domicilio',
        resumenClinico: 'Dolor controlado.',
        indicaciones: 'Control ambulatorio.',
        signosAlarma: 'Fiebre o dolor intenso.',
        requiereControl: true,
        requiereReferencia: false
      }
    };

    component.prepararResumen();

    expect(component.mensaje).toContain('Triaje: Naranja · Dolor: 7/10');
    expect(component.mensaje).toContain('TA 118/76 mmHg');
    expect(component.mensaje).toContain('Alergias: Penicilina');
    expect(component.mensaje).toContain('Diagnóstico principal: R10.4 Otros dolores abdominales');
    expect(component.mensaje).toContain('Paracetamol · 1 g · VO · Cada 8 horas · 3 días');
    expect(component.mensaje).toContain('Hemograma completo · Urgente · Con resultado: Sin leucocitosis');
    expect(component.mensaje).toContain('Egreso: Alta médica · Estable · Destino: Domicilio');
    expect(component.mensaje).toContain('Signos de alarma: Fiebre o dolor intenso.');
  });
});
