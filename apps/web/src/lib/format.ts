export function pesos(centavos: number) {
	return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(centavos / 100);
}

export function fechaHora(valor: Date | string) {
	return new Intl.DateTimeFormat('es-MX', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'America/Mexico_City'
	}).format(new Date(valor));
}

export function fecha(valor: string) {
	const [anio, mes, dia] = valor.split('-').map(Number);
	return new Intl.DateTimeFormat('es-MX', {
		dateStyle: 'medium',
		timeZone: 'America/Mexico_City'
	}).format(new Date(Date.UTC(anio, mes - 1, dia, 18)));
}

export function nombrePeriodo(valor: string) {
	const [anio, mes] = valor.split('-').map(Number);
	return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date(anio, mes - 1, 1));
}

export function pesosACentavos(valor: string) {
	const limpio = valor.replace(/[$,\s]/g, '');
	if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
	const [enteros, fraccion = ''] = limpio.split('.');
	return Number(enteros) * 100 + Number(fraccion.padEnd(2, '0'));
}

export function ahoraMexicoLocal() {
	const partes = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Mexico_City',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(new Date());
	const tomar = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? '';
	return `${tomar('year')}-${tomar('month')}-${tomar('day')}T${tomar('hour')}:${tomar('minute')}`;
}
