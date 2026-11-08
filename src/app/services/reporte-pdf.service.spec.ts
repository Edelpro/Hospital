import { TestBed } from '@angular/core/testing';

import { Atencion } from '../models/atencion.model';
import { AuthService } from './auth';
import { ReportePdfService } from './reporte-pdf.service';

describe('ReportePdfService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: AuthService,
        useValue: {
          obtenerNombreCompleto: () => 'Ana Torres',
          obtenerRolActual: () => 'Doctor'
        }
      }]
    });
  });

  it('genera un resumen PDF válido de una sola hoja y con un nombre seguro', async () => {
    const service = TestBed.inject(ReportePdfService);
    const atencion: Atencion = {
      id: 18,
      pacienteId: 3,
      paciente: {
        id: 3,
        cedula: '0912345678',
        nombres: 'José Andrés',
        apellidos: 'Pérez López',
        sexo: 'Masculino'
      },
      motivoConsulta: 'Dolor abdominal',
      enfermedadActualBreve: 'Dolor de doce horas de evolución.',
      procedencia: 'Domicilio',
      condicionLlegada: 'Ambulatorio',
      tieneAcompanante: false,
      estado: 'Con egreso',
      triaje: {
        atencionId: 18,
        prioridad: 'Naranja',
        oxigenoSuplementario: false,
        alergiaConocida: false,
        riesgoCaida: false,
        aislamiento: false
      },
      diagnosticos: [{
        atencionId: 18,
        codigoCie10: 'R10.4',
        descripcionCie10: 'Otros dolores abdominales',
        tipoDiagnostico: 'Definitivo',
        condicion: 'Principal'
      }],
      prescripciones: [],
      examenes: [],
      evoluciones: []
    };

    const resultado = await service.generar({ fechaGeneracion: '2026-09-26T12:00:00-05:00', atencion });
    const contenido = new TextDecoder('latin1').decode(await resultado.blob.arrayBuffer());
    const cabecera = contenido.slice(0, 5);

    expect(resultado.nombre).toBe('HCU008_AT-18_Perez_Lopez_Jose_Andres.pdf');
    expect(resultado.archivo.type).toBe('application/pdf');
    expect(resultado.blob.size).toBeGreaterThan(1000);
    expect(cabecera).toBe('%PDF-');
    expect((contenido.match(/\/Type\s*\/Page\b/g) ?? []).length).toBe(1);
  });
});
