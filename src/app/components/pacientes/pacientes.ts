import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Paciente } from '../../models/paciente.model';
import { PacienteService } from '../../services/paciente.service';
import { AuthService } from '../../services/auth';
import { UiMessageService } from '../../shared/ui-message.service';

interface CantonCatalogo {
  nombre: string;
  parroquias: string[];
}

interface ProvinciaCatalogo {
  nombre: string;
  cantones: CantonCatalogo[];
}

@Component({
  selector: 'app-pacientes',
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes implements OnInit {
  @Output() pacienteSeleccionado = new EventEmitter<Paciente>();

  @Output() pacienteActualizado = new EventEmitter<Paciente>();
  @Output() pacienteEliminado = new EventEmitter<number>();
  pacientes: Paciente[] = [];
  pacienteResumen?: Paciente;

  textoBusqueda = '';
  mostrarFormularioPaciente = false;
  modoEdicion = false;
  guardando = false;
  eliminandoId?: number;

  sexos: string[] = [
    'Masculino',
    'Femenino',
    'No especificado'
  ];

  provincias: ProvinciaCatalogo[] = this.crearCatalogoProvincias();

  cantonesDisponibles: CantonCatalogo[] = [];
  parroquiasDisponibles: string[] = [];

  nuevoPaciente: Paciente = this.crearPacienteVacio();

  constructor(
    private pacienteService: PacienteService,
    private authService: AuthService,
    private uiMessageService: UiMessageService
  ) {}

  ngOnInit(): void {
    this.actualizarCantones();
    this.actualizarParroquias();
    this.cargarPacientes();
  }

  get pacientesVista(): Paciente[] {
    const texto = this.textoBusqueda.trim().toLowerCase();

    if (!texto) {
      return this.pacientes;
    }

    return this.pacientes.filter((paciente) => {
      const nombres = (paciente.nombres || '').toLowerCase();
      const apellidos = (paciente.apellidos || '').toLowerCase();
      const cedula = (paciente.cedula || '').toLowerCase();
      const provincia = (paciente.provincia || '').toLowerCase();
      const canton = (paciente.canton || '').toLowerCase();
      const nombreCompleto = `${nombres} ${apellidos}`;

      return (
        nombreCompleto.includes(texto) ||
        cedula.includes(texto) ||
        provincia.includes(texto) ||
        canton.includes(texto)
      );
    });
  }

  crearCatalogoProvincias(): ProvinciaCatalogo[] {
    return [
      {
        nombre: 'Santa Elena',
        cantones: [
          {
            nombre: 'La Libertad',
            parroquias: ['La Libertad']
          },
          {
            nombre: 'Santa Elena',
            parroquias: [
              'Santa Elena',
              'Ballenita',
              'Atahualpa',
              'Colonche',
              'Chanduy',
              'Manglaralto',
              'San José de Ancón',
              'Simón Bolívar'
            ]
          },
          {
            nombre: 'Salinas',
            parroquias: [
              'Salinas',
              'Anconcito',
              'José Luis Tamayo'
            ]
          }
        ]
      },
      this.crearProvinciaSinCatalogo('Azuay'),
      this.crearProvinciaSinCatalogo('Bolívar'),
      this.crearProvinciaSinCatalogo('Cañar'),
      this.crearProvinciaSinCatalogo('Carchi'),
      this.crearProvinciaSinCatalogo('Chimborazo'),
      this.crearProvinciaSinCatalogo('Cotopaxi'),
      this.crearProvinciaSinCatalogo('El Oro'),
      this.crearProvinciaSinCatalogo('Esmeraldas'),
      this.crearProvinciaSinCatalogo('Galápagos'),
      this.crearProvinciaSinCatalogo('Guayas'),
      this.crearProvinciaSinCatalogo('Imbabura'),
      this.crearProvinciaSinCatalogo('Loja'),
      this.crearProvinciaSinCatalogo('Los Ríos'),
      this.crearProvinciaSinCatalogo('Manabí'),
      this.crearProvinciaSinCatalogo('Morona Santiago'),
      this.crearProvinciaSinCatalogo('Napo'),
      this.crearProvinciaSinCatalogo('Orellana'),
      this.crearProvinciaSinCatalogo('Pastaza'),
      this.crearProvinciaSinCatalogo('Pichincha'),
      this.crearProvinciaSinCatalogo('Santo Domingo de los Tsáchilas'),
      this.crearProvinciaSinCatalogo('Sucumbíos'),
      this.crearProvinciaSinCatalogo('Tungurahua'),
      this.crearProvinciaSinCatalogo('Zamora Chinchipe'),
      this.crearProvinciaSinCatalogo('Exterior / Otra')
    ];
  }

  crearProvinciaSinCatalogo(nombre: string): ProvinciaCatalogo {
    return {
      nombre,
      cantones: [
        {
          nombre: 'No especificado',
          parroquias: ['No especificada']
        }
      ]
    };
  }

  crearPacienteVacio(): Paciente {
    return {
      cedula: '',
      nombres: '',
      apellidos: '',
      fechaNacimiento: null,
      sexo: 'Masculino',
      telefono: null,
      direccion: null,
      provincia: 'Santa Elena',
      canton: 'La Libertad',
      parroquia: 'La Libertad'
    };
  }

  alternarFormularioPaciente(): void {
    if (this.mostrarFormularioPaciente) {
      this.cancelarFormularioPaciente();
      return;
    }

    this.modoEdicion = false;
    this.mostrarFormularioPaciente = true;
    this.nuevoPaciente = this.crearPacienteVacio();
    this.actualizarCantones();
    this.actualizarParroquias();
  }

  cancelarFormularioPaciente(): void {
    this.uiMessageService.confirmar(
      this.modoEdicion ? 'Cancelar edición' : 'Cancelar registro',
      'Se cerrará el formulario. Los datos no guardados se perderán.',
      () => {
        this.nuevoPaciente = this.crearPacienteVacio();
        this.actualizarCantones();
        this.actualizarParroquias();
        this.mostrarFormularioPaciente = false;
        this.modoEdicion = false;
      },
      'Cerrar formulario',
      'Volver'
    );
  }

  cargarPacientes(): void {
    this.pacienteService.obtenerPacientes().subscribe({
      next: (datos: Paciente[]) => {
        this.pacientes = datos || [];
      },
      error: (error: any) => {
        console.error('Error al cargar pacientes:', error);

        this.uiMessageService.error(
          'Error al cargar pacientes',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  buscarPacientes(): void {}

  actualizarCantones(): void {
    const provinciaSeleccionada = this.provincias.find(
      (provincia) => provincia.nombre === this.nuevoPaciente.provincia
    );

    this.cantonesDisponibles = provinciaSeleccionada?.cantones || [];

    const cantonExiste = this.cantonesDisponibles.some(
      (canton) => canton.nombre === this.nuevoPaciente.canton
    );

    if (!cantonExiste) {
      this.nuevoPaciente.canton = this.cantonesDisponibles[0]?.nombre || null;
    }

    this.actualizarParroquias();
  }

  actualizarParroquias(): void {
    const cantonSeleccionado = this.cantonesDisponibles.find(
      (canton) => canton.nombre === this.nuevoPaciente.canton
    );

    this.parroquiasDisponibles = cantonSeleccionado?.parroquias || [];

    const parroquiaExiste = this.parroquiasDisponibles.some(
      (parroquia) => parroquia === this.nuevoPaciente.parroquia
    );

    if (!parroquiaExiste) {
      this.nuevoPaciente.parroquia = this.parroquiasDisponibles[0] || null;
    }
  }

  seleccionarPacienteLocal(paciente: Paciente): void {
    this.pacienteResumen = {
      id: paciente.id,
      cedula: paciente.cedula || '',
      nombres: paciente.nombres || '',
      apellidos: paciente.apellidos || '',
      fechaNacimiento: paciente.fechaNacimiento || null,
      sexo: paciente.sexo || 'No registrado',
      telefono: paciente.telefono || null,
      direccion: paciente.direccion || null,
      provincia: paciente.provincia || null,
      canton: paciente.canton || null,
      parroquia: paciente.parroquia || null
    };
  }

  pacienteEstaSeleccionado(paciente: Paciente): boolean {
    return this.pacienteResumen?.id === paciente.id;
  }

  confirmarSeleccionPaciente(): void {
    if (!this.pacienteResumen) {
      this.uiMessageService.advertencia(
        'Paciente requerido',
        'Seleccione un paciente antes de continuar.'
      );
      return;
    }

    this.pacienteSeleccionado.emit(this.pacienteResumen);
  }

  guardarPaciente(): void {
    if (this.guardando) {
      return;
    }

    this.normalizarPacienteFormulario();

    const cedula = this.nuevoPaciente.cedula || '';
    const nombres = this.nuevoPaciente.nombres || '';
    const apellidos = this.nuevoPaciente.apellidos || '';

    if (!cedula || !nombres || !apellidos) {
      this.uiMessageService.advertencia(
        'Datos incompletos',
        'Debe ingresar cédula, nombres y apellidos del paciente.'
      );
      return;
    }

    if (!this.validarIdentificacionFlexible(cedula)) {
      this.uiMessageService.advertencia(
        'Identificación no válida',
        'Ingrese una identificación de 10 dígitos. No se compara con la provincia de residencia actual.'
      );
      return;
    }

    if (!this.modoEdicion && this.existeCedulaRegistrada(cedula)) {
      this.uiMessageService.advertencia(
        'Paciente ya registrado',
        'Ya existe un paciente registrado con esta cédula. Búsquelo en la lista y selecciónelo.'
      );
      return;
    }

    if (
      this.modoEdicion &&
      this.pacientes.some((p) => p.cedula === cedula && p.id !== this.nuevoPaciente.id)
    ) {
      this.uiMessageService.advertencia(
        'Cédula duplicada',
        'Ya existe otro paciente registrado con esta cédula.'
      );
      return;
    }

    if (!this.nuevoPaciente.sexo) {
      this.uiMessageService.advertencia(
        'Sexo requerido',
        'Debe seleccionar el sexo del paciente.'
      );
      return;
    }

    if (!this.validarFechaNacimiento()) {
      return;
    }

    if (!this.validarUbicacionResidencia()) {
      return;
    }

    if (!this.validarTelefono()) {
      return;
    }

    const pacienteParaGuardar: Paciente = {
      id: this.nuevoPaciente.id,
      cedula,
      nombres,
      apellidos,
      fechaNacimiento: this.nuevoPaciente.fechaNacimiento || null,
      sexo: this.nuevoPaciente.sexo,
      telefono: this.nuevoPaciente.telefono,
      direccion: this.nuevoPaciente.direccion,
      provincia: this.nuevoPaciente.provincia,
      canton: this.nuevoPaciente.canton,
      parroquia: this.nuevoPaciente.parroquia
    };

    this.guardando = true;

    if (this.modoEdicion && pacienteParaGuardar.id) {
      this.pacienteService.actualizarPaciente(pacienteParaGuardar.id, pacienteParaGuardar).subscribe({
        next: (pacienteActualizado: Paciente) => {
          this.guardando = false;

          this.uiMessageService.exito(
            'Paciente actualizado',
            'Los datos del paciente fueron actualizados correctamente.'
          );

          this.pacienteActualizado.emit(pacienteActualizado);
          this.agregarPacienteAListaLocal(pacienteActualizado);
          this.seleccionarPacienteLocal(pacienteActualizado);

          this.nuevoPaciente = this.crearPacienteVacio();
          this.actualizarCantones();
          this.actualizarParroquias();
          this.mostrarFormularioPaciente = false;
          this.modoEdicion = false;
        },
        error: (error: any) => {
          console.error('Error al actualizar paciente:', error);

          this.guardando = false;

          this.uiMessageService.error(
            'Error al actualizar paciente',
            this.obtenerMensajeError(error)
          );
        }
      });

      return;
    }

    this.pacienteService.crearPaciente(pacienteParaGuardar).subscribe({
      next: (pacienteGuardado: Paciente) => {
        this.guardando = false;

        this.uiMessageService.exito(
          'Paciente guardado',
          'El paciente fue registrado correctamente.'
        );

        this.nuevoPaciente = this.crearPacienteVacio();
        this.actualizarCantones();
        this.actualizarParroquias();

        this.mostrarFormularioPaciente = false;
        this.modoEdicion = false;

        
        this.agregarPacienteAListaLocal(pacienteGuardado);
        this.seleccionarPacienteLocal(pacienteGuardado);

        this.uiMessageService.informacion(
          'Paciente seleccionado',
          'Revise el resumen del paciente y presione “Crear atención para este paciente” para continuar.'
        );
      },
      error: (error: any) => {
        console.error('Error al guardar paciente:', error);

        this.guardando = false;

        this.uiMessageService.error(
          'Error al guardar paciente',
          this.obtenerMensajeError(error)
        );
      }
    });
  }

  editarPaciente(paciente: Paciente, event?: Event): void {
    event?.stopPropagation();

    this.modoEdicion = true;
    this.mostrarFormularioPaciente = true;

    this.nuevoPaciente = {
      id: paciente.id,
      cedula: paciente.cedula || '',
      nombres: paciente.nombres || '',
      apellidos: paciente.apellidos || '',
      fechaNacimiento: paciente.fechaNacimiento || null,
      sexo: paciente.sexo || 'Masculino',
      telefono: paciente.telefono || null,
      direccion: paciente.direccion || null,
      provincia: paciente.provincia || 'Santa Elena',
      canton: paciente.canton || 'La Libertad',
      parroquia: paciente.parroquia || 'La Libertad'
    };

    this.actualizarCantones();
    this.actualizarParroquias();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  eliminarPaciente(paciente: Paciente, event?: Event): void {
    event?.stopPropagation();

    if (!paciente.id) {
      return;
    }

    if (!this.esAdministrador()) {
      this.uiMessageService.advertencia(
        'Acceso restringido',
        'Solo el administrador puede eliminar pacientes.'
      );
      return;
    }

    this.uiMessageService.confirmar(
      'Eliminar paciente',
      `Se eliminará el paciente ${paciente.nombres} ${paciente.apellidos}. Use esta acción solo si fue creado por error o está duplicado.`,
      () => {
        this.eliminandoId = paciente.id;

        this.pacienteService.eliminarPaciente(paciente.id!).subscribe({
          next: () => {
            this.pacienteEliminado.emit(paciente.id!);
            this.eliminandoId = undefined;

            this.uiMessageService.exito(
              'Paciente eliminado',
              'El paciente fue eliminado correctamente.'
            );

            this.pacientes = this.pacientes.filter((p) => p.id !== paciente.id);

            if (this.pacienteResumen?.id === paciente.id) {
              this.pacienteResumen = undefined;
            }

            if (this.nuevoPaciente.id === paciente.id) {
              this.nuevoPaciente = this.crearPacienteVacio();
              this.modoEdicion = false;
              this.mostrarFormularioPaciente = false;
            }
          },
          error: (error: any) => {
            console.error('Error al eliminar paciente:', error);

            this.eliminandoId = undefined;

            this.uiMessageService.error(
              'Error al eliminar paciente',
              this.obtenerMensajeError(error)
            );
          }
        });
      },
      'Eliminar',
      'Cancelar'
    );
  }

  puedeEliminarPaciente(): boolean {
    return this.esAdministrador();
  }

  esAdministrador(): boolean {
    const rol = (this.authService.obtenerUsuarioActual()?.rol || '').trim().toLowerCase();

    return (
      rol === 'admin' ||
      rol === 'administrador' ||
      rol === 'director médico' ||
      rol === 'director medico'
    );
  }

  normalizarPacienteFormulario(): void {
    this.nuevoPaciente.cedula = (this.nuevoPaciente.cedula || '').trim().replace(/\D/g, '');
    this.nuevoPaciente.nombres = this.limpiarTexto(this.nuevoPaciente.nombres) || '';
    this.nuevoPaciente.apellidos = this.limpiarTexto(this.nuevoPaciente.apellidos) || '';
    this.nuevoPaciente.telefono = this.limpiarTexto(this.nuevoPaciente.telefono);
    this.nuevoPaciente.direccion = this.limpiarTexto(this.nuevoPaciente.direccion);
    this.nuevoPaciente.provincia = this.limpiarTexto(this.nuevoPaciente.provincia);
    this.nuevoPaciente.canton = this.limpiarTexto(this.nuevoPaciente.canton);
    this.nuevoPaciente.parroquia = this.limpiarTexto(this.nuevoPaciente.parroquia);
  }

  existeCedulaRegistrada(cedula: string): boolean {
    return this.pacientes.some(
      (paciente) => (paciente.cedula || '').trim() === cedula
    );
  }

  validarIdentificacionFlexible(cedula: string): boolean {
    const valor = (cedula || '').trim();

    if (!/^\d{10}$/.test(valor)) {
      return false;
    }

    if (/^(\d)\1{9}$/.test(valor)) {
      return false;
    }

    return true;
  }

  validarCedulaEcuatoriana(cedula: string): boolean {
    return this.validarIdentificacionFlexible(cedula);
  }

  validarUbicacionResidencia(): boolean {
    if (!this.nuevoPaciente.provincia) {
      this.uiMessageService.advertencia(
        'Provincia requerida',
        'Debe seleccionar la provincia de residencia actual del paciente.'
      );
      return false;
    }

    if (!this.nuevoPaciente.canton) {
      this.uiMessageService.advertencia(
        'Cantón requerido',
        'Debe seleccionar el cantón o dejar “No especificado” si la provincia no pertenece al catálogo local.'
      );
      return false;
    }

    if (!this.nuevoPaciente.parroquia) {
      this.uiMessageService.advertencia(
        'Parroquia requerida',
        'Debe seleccionar la parroquia o dejar “No especificada” si la provincia no pertenece al catálogo local.'
      );
      return false;
    }

    if (this.nuevoPaciente.provincia !== 'Santa Elena') {
      if (!this.nuevoPaciente.direccion || this.nuevoPaciente.direccion.length < 5) {
        this.uiMessageService.advertencia(
          'Dirección requerida',
          'Para pacientes de otra provincia, registre en dirección el cantón, parroquia, barrio o referencia.'
        );
        return false;
      }
    }

    return true;
  }

  validarFechaNacimiento(): boolean {
    const fechaNacimiento = this.nuevoPaciente.fechaNacimiento;

    if (!fechaNacimiento) {
      return true;
    }

    const nacimiento = new Date(fechaNacimiento);

    if (isNaN(nacimiento.getTime())) {
      this.uiMessageService.advertencia(
        'Fecha inválida',
        'La fecha de nacimiento ingresada no es válida.'
      );
      return false;
    }

    const hoy = new Date();

    if (nacimiento > hoy) {
      this.uiMessageService.advertencia(
        'Fecha inválida',
        'La fecha de nacimiento no puede ser futura.'
      );
      return false;
    }

    const edad = this.calcularEdad(fechaNacimiento);

    if (edad > 130) {
      this.uiMessageService.advertencia(
        'Fecha poco probable',
        'Revise la fecha de nacimiento. La edad calculada supera 130 años.'
      );
      return false;
    }

    return true;
  }

  validarTelefono(): boolean {
    const telefono = this.nuevoPaciente.telefono;

    if (!telefono) {
      return true;
    }

    const soloDigitos = telefono.replace(/\D/g, '');

    if (soloDigitos.length < 7 || soloDigitos.length > 10) {
      this.uiMessageService.advertencia(
        'Teléfono no válido',
        'Ingrese un teléfono válido o deje el campo vacío.'
      );
      return false;
    }

    this.nuevoPaciente.telefono = soloDigitos;

    return true;
  }

  agregarPacienteAListaLocal(paciente: Paciente): void {
    const existe = this.pacientes.some(
      (p) => p.id === paciente.id || p.cedula === paciente.cedula
    );

    if (!existe) {
      this.pacientes = [paciente, ...this.pacientes];
      return;
    }

    this.pacientes = this.pacientes.map((p) => {
      if (p.id === paciente.id || p.cedula === paciente.cedula) {
        return paciente;
      }

      return p;
    });
  }

  limpiarFormularioPaciente(): void {
    this.uiMessageService.confirmar(
      'Limpiar formulario',
      'Esta acción limpiará los datos ingresados del paciente en pantalla. No eliminará pacientes guardados.',
      () => {
        this.nuevoPaciente = this.crearPacienteVacio();
        this.actualizarCantones();
        this.actualizarParroquias();
        this.modoEdicion = false;

        this.uiMessageService.informacion(
          'Formulario limpio',
          'El formulario de paciente fue limpiado correctamente.'
        );
      },
      'Limpiar',
      'Cancelar'
    );
  }

  obtenerEdadTexto(fechaNacimiento?: string | null): string {
    if (!fechaNacimiento) {
      return 'Edad no registrada';
    }

    const nacimiento = new Date(fechaNacimiento);

    if (isNaN(nacimiento.getTime())) {
      return 'Edad no registrada';
    }

    const edad = this.calcularEdad(fechaNacimiento);

    if (edad < 0) {
      return 'Edad no registrada';
    }

    return `${edad} años`;
  }

  calcularEdad(fechaNacimiento: string): number {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  limpiarTexto(valor?: string | null): string | null {
    const texto = (valor || '').trim().replace(/\s+/g, ' ');
    return texto || null;
  }

  trackByPaciente(index: number, paciente: Paciente): number | string {
    return paciente.id || paciente.cedula || index;
  }

  obtenerMensajeError(error: any): string {
    if (error?.error?.errors) {
      const errores = error.error.errors;

      const mensajes = Object.keys(errores)
        .map((campo) => {
          const detalle = Array.isArray(errores[campo])
            ? errores[campo].join(' ')
            : errores[campo];

          return `${campo}: ${detalle}`;
        })
        .join('\n');

      return mensajes || 'Uno o más campos no pasaron la validación.';
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.mensaje) {
      return error.error.mensaje;
    }

    if (error?.error?.title) {
      return error.error.title;
    }

    if (error?.status === 401) {
      return 'Sesión expirada o no autorizada. Inicie sesión nuevamente.';
    }

    if (error?.status === 403) {
      return 'No tiene permisos para realizar esta acción.';
    }

    if (error?.message) {
      return error.message;
    }

    return 'No se pudo completar la operación.';
  }
}