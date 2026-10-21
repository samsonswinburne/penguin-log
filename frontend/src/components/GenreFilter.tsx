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
		<label className="pt-2 ml-0.5 mb-0.5">
			<p className="mb-1 font-semibold">Genre</p>
			<select
				className="border"
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
