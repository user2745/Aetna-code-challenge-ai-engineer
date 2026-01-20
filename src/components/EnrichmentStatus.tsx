type Props = {
	active?: boolean
	label?: string
}

function EnrichmentStatus({ active, label }: Props) {
	if (!active) return null

	return (
		<div className="enrichment-status">
			<span className="dot" />
			<span>{label ?? 'Generating response...'}</span>
		</div>
	)
}

export default EnrichmentStatus
