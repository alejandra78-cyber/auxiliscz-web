import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReporteAudioResponse, TallerService } from '../../services/taller.service';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

@Component({
  selector: 'app-reportes-audio-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-audio-page.component.html',
  styleUrl: './reportes-audio-page.component.css',
})
export class ReportesAudioPageComponent {
  consulta = '';
  fechaInicio = '';
  fechaFin = '';
  resultado: ReporteAudioResponse | null = null;
  escuchando = false;
  procesando = false;
  error = '';
  speechDisponible = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  private recognition: any = null;
  private detencionManual = false;

  ejemplos = [
    '¿Cuánto gané este mes?',
    '¿Cuánto cobré con tarjeta entre enero y marzo?',
    '¿Cuántos servicios completé?',
    'Muéstrame mis últimas evaluaciones.',
  ];

  constructor(private readonly tallerService: TallerService) {}

  escuchar(): void {
    this.error = '';
    if (this.escuchando) {
      this.detenerAudio();
      return;
    }
    if (!this.speechDisponible) {
      this.error = 'Tu navegador no soporta Web Speech API. Puedes escribir la consulta manualmente.';
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.detencionManual = false;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-BO';
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.escuchando = true;
    this.recognition.onresult = (event: any) => {
      let transcript = '';
      let finalizado = false;
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || '';
        finalizado = finalizado || event.results[index].isFinal;
      }
      this.consulta = transcript.trim();
      if (finalizado && this.consulta) {
        this.escuchando = false;
        this.consultar();
      }
    };
    this.recognition.onerror = () => {
      this.escuchando = false;
      if (!this.detencionManual) {
        this.error = 'No se pudo capturar el audio. Intenta nuevamente o escribe la consulta.';
      }
    };
    this.recognition.onend = () => {
      this.escuchando = false;
      this.recognition = null;
    };
    this.recognition.start();
  }

  detenerAudio(): void {
    this.detencionManual = true;
    this.escuchando = false;
    try {
      this.recognition?.stop();
    } catch {
      this.recognition = null;
    }
  }

  consultar(): void {
    const text = this.consulta.trim();
    if (!text) {
      this.error = 'Escribe o dicta una consulta para generar el reporte.';
      return;
    }
    this.procesando = true;
    this.error = '';
    this.resultado = null;
    this.tallerService.consultarReporteAudio(text, this.fechaInicio, this.fechaFin).subscribe({
      next: (res) => {
        this.resultado = res;
        this.procesando = false;
      },
      error: (err) => {
        this.error = err?.error?.detail || 'No se pudo consultar el reporte por audio';
        this.procesando = false;
      },
    });
  }

  usarEjemplo(value: string): void {
    this.consulta = value;
    this.consultar();
  }

  labelIntencion(value?: string): string {
    return (value || '-').replaceAll('_', ' ');
  }

  tablaKeys(): string[] {
    const first = this.resultado?.tabla?.[0];
    return first ? Object.keys(first) : [];
  }

  descargarCsv(): void {
    if (!this.resultado) return;
    const rows = this.reporteRows();
    const csv = rows.map((row) => row.map((cell) => this.csvCell(cell)).join(';')).join('\r\n');
    this.descargarBlob(`\ufeff${csv}`, 'reporte.csv', 'text/csv;charset=utf-8');
  }

  descargarExcel(): void {
    if (!this.resultado) return;
    const resumenRows = this.resultado.resumen
      .map(
        (item) =>
          `<tr><td>${this.htmlCell(item.label)}</td><td class="value">${this.htmlCell(String(item.valor))}</td></tr>`,
      )
      .join('');
    const detalleKeys = this.tablaKeys();
    const detalle = this.resultado.tabla.length
      ? `
        <h2>Detalle</h2>
        <table>
          <thead><tr>${detalleKeys.map((key) => `<th>${this.htmlCell(key)}</th>`).join('')}</tr></thead>
          <tbody>
            ${this.resultado.tabla
              .map((row) => `<tr>${detalleKeys.map((key) => `<td>${this.htmlCell(String(row[key] ?? '-'))}</td>`).join('')}</tr>`)
              .join('')}
          </tbody>
        </table>`
      : '<p class="empty">Sin detalle adicional.</p>';
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body{font-family:Arial,sans-serif;color:#14223a}
            .title{background:#1f3a7a;color:#fff;font-size:22px;font-weight:bold;padding:16px}
            .meta,.summary{margin-top:18px;border-collapse:collapse;width:100%}
            .meta td,.summary td,th,td{border:1px solid #d9e2f1;padding:10px}
            .meta td:first-child,.summary td:first-child{font-weight:bold;background:#f3f6fb;width:220px}
            h2{margin:24px 0 8px;color:#1f3a7a}
            table{border-collapse:collapse;width:100%;margin-top:8px}
            th{background:#eaf1ff;color:#1f3a7a;text-align:left}
            .value{font-weight:bold}
            .empty{color:#667085}
          </style>
        </head>
        <body>
          <div class="title">AuxilioSCZ - Reporte</div>
          <table class="meta">
            <tr><td>Consulta</td><td>${this.htmlCell(this.resultado.consulta)}</td></tr>
            <tr><td>Intención</td><td>${this.htmlCell(this.labelIntencion(this.resultado.intencion))}</td></tr>
            <tr><td>Fecha inicio</td><td>${this.htmlCell(this.resultado.fecha_inicio || 'Sin filtro')}</td></tr>
            <tr><td>Fecha fin</td><td>${this.htmlCell(this.resultado.fecha_fin || 'Sin filtro')}</td></tr>
            <tr><td>Resultado</td><td>${this.htmlCell(this.resultado.mensaje)}</td></tr>
          </table>
          <h2>Resumen</h2>
          <table class="summary"><tbody>${resumenRows || '<tr><td colspan="2">Sin datos disponibles</td></tr>'}</tbody></table>
          ${detalle}
        </body>
      </html>`;
    this.descargarBlob(`\ufeff${html}`, 'reporte.xls', 'application/vnd.ms-excel;charset=utf-8');
  }

  descargarPdf(): void {
    if (!this.resultado) return;
    const lines = [
      'AuxilioSCZ - Reporte',
      `Generado: ${new Date().toLocaleString('es-BO')}`,
      '',
      'Consulta',
      this.pdfText(this.resultado.consulta),
      '',
      'Interpretacion',
      `Intencion: ${this.pdfText(this.labelIntencion(this.resultado.intencion))}`,
      `Fecha inicio: ${this.pdfText(this.resultado.fecha_inicio || 'Sin filtro')}`,
      `Fecha fin: ${this.pdfText(this.resultado.fecha_fin || 'Sin filtro')}`,
      `Resultado: ${this.pdfText(this.resultado.mensaje)}`,
      '',
      'Resumen',
      ...(this.resultado.resumen.length
        ? this.resultado.resumen.map((item) => `${this.pdfText(item.label)}: ${this.pdfText(String(item.valor))}`)
        : ['Sin datos disponibles']),
    ];
    if (this.resultado.tabla.length > 0) {
      const keys = this.tablaKeys();
      lines.push('', 'Detalle');
      this.resultado.tabla.forEach((row, index) => {
        lines.push(`Registro ${index + 1}`);
        keys.forEach((key) => lines.push(`  ${this.pdfText(key)}: ${this.pdfText(String(row[key] ?? '-'))}`));
      });
    }
    const pdf = this.crearPdfTexto(lines);
    this.descargarBlob(pdf, 'reporte.pdf', 'application/pdf');
  }

  private reporteRows(): string[][] {
    if (!this.resultado) return [];
    const rows: string[][] = [
      ['AuxilioSCZ - Reporte'],
      ['Generado', new Date().toLocaleString('es-BO')],
      ['Consulta', this.resultado.consulta],
      ['Intención', this.labelIntencion(this.resultado.intencion)],
      ['Fecha inicio', this.resultado.fecha_inicio || 'Sin filtro'],
      ['Fecha fin', this.resultado.fecha_fin || 'Sin filtro'],
      ['Mensaje', this.resultado.mensaje],
      [],
      ['Resumen'],
      ['Indicador', 'Valor'],
      ...this.resultado.resumen.map((item) => [item.label, String(item.valor)]),
    ];
    if (this.resultado.tabla.length > 0) {
      const keys = this.tablaKeys();
      rows.push([], ['Detalle'], keys);
      this.resultado.tabla.forEach((row) => rows.push(keys.map((key) => String(row[key] ?? ''))));
    }
    return rows;
  }

  private csvCell(value: string): string {
    return `"${String(value).replaceAll('"', '""')}"`;
  }

  private htmlCell(value: string): string {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  private pdfText(value: string): string {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '');
  }

  private descargarBlob(content: BlobPart, fileName: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private crearPdfTexto(lines: string[]): string {
    const pageHeight = 792;
    const linesPerPage = 42;
    const pages: string[][] = [];
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pages.push(lines.slice(i, i + linesPerPage));
    }
    const objects: string[] = [
      '',
      '',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    const pageRefs: number[] = [];
    pages.forEach((pageLines) => {
      const content = pageLines
        .flatMap((line) => this.wrapPdfLine(line, 92))
        .slice(0, linesPerPage)
        .map((line, index) => `BT /F1 10 Tf 50 ${pageHeight - 60 - index * 17} Td (${this.escapePdf(line)}) Tj ET`)
        .join('\n');
      const contentObj = objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      const pageObj = objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObj} 0 R >>`);
      pageRefs.push(pageObj);
    });
    objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[1] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((obj, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return pdf;
  }

  private wrapPdfLine(value: string, size: number): string[] {
    const clean = value.replace(/\s+/g, ' ').trim();
    if (clean.length <= size) return [clean];
    const chunks: string[] = [];
    for (let i = 0; i < clean.length; i += size) chunks.push(clean.slice(i, i + size));
    return chunks;
  }

  private escapePdf(value: string): string {
    return value.replace(/[()\\]/g, (char) => `\\${char}`);
  }
}
