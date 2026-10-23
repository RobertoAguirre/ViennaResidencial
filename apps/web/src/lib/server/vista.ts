export function publicarIncidencia<T extends { reportadaPor: string; reportante: string }>(
	item: T,
	comite: boolean,
	usuarioId: string
) {
	const { reportante, reportadaPor, ...resto } = item;
	return {
		...resto,
		propia: reportadaPor === usuarioId,
		reportante: comite ? reportante : null
	};
}
