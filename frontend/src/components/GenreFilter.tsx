import type { Genre } from "../lib/api";

export function GenreFilter({
	genres,
	value,
	onChange,
}: {
	genres: Genre[];
	value: number | undefined;
	onChange: (genre: number | undefined) => void;
}) {
	return (
		<label className="block">
			Genre
			<select
				className="block border p-2"
				value={value ?? ""}
				onChange={(event) =>
					onChange(event.target.value ? Number(event.target.value) : undefined)
				}
			>
				<option value="">All genres</option>
				{genres.map((genre) => (
					<option key={genre.id} value={genre.id}>
						{genre.name}
					</option>
				))}
			</select>
		</label>
	);
}
