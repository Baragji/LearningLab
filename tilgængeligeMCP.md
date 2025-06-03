
Her er en oversigt over de viste MCP-servere og deres funktioner i punktform:

### sequential-thinking

En detaljeret værktøj til dynamisk og reflekterende problemløsning.

### file-context-server

read_context: Læs og analyser kodefiler med avanceret filtrering og chunking.
get_chunk_count: Hent det samlede antal chunks, der returneres for en read_context...
set_profile: Indstil den aktive profil for kontekstgenerering.
get_profile_context: Hent repository-kontekst baseret på aktuelle profilindstillinger.
generate_outline: Generer en kodeoversigt for en fil, der viser dens struktur (klasser, f..).

### Puppeteer

puppeteer_navigate: Naviger til en URL.
puppeteer_screenshot: Tag et skærmbillede af den aktuelle side eller et specifikt element.
puppeteer_click: Klik på et element på siden.
puppeteer_fill: Udfyld et inputfelt.
puppeteer_select: Vælg et element på siden med Select-tag.
puppeteer_hover: Hold musen over et element på siden.
puppeteer_evaluate: Udfør JavaScript i browserkonsollen.

### code-assistant-ollama

perplexity_ask: Engagerer i en samtale ved hjælp af Perplexity Sonar API og returnerer...
execute_command: Udfør en kommandolinje inden for et specificeret projekt.
web_fetch: Hent og udpak indhold fra en webside. Dette værktøj downloader t..
replace_in_file: Erstat sektioner i en fil inden for et specificeret projekt ved at søge/r...
write_file: Opretter eller overskriver en fil. Bruges til nye filer eller ved opdatering m...
list_files: Vis filer i mapper inden for et specificeret projekt.
delete_files: Slet filer fra et specificeret projekt. Denne handling kan ikke være un...
list_projects: Vis alle tilgængelige projekter. Brug dette værktøj til at opdage, hvilke projekter ...
read_files: Indlæs filer i arbejdshukommelsen. Du kan angive linjeområder ved ap...
web_search: Søg på nettet ved hjælp af DuckDuckGo. Dette værktøj udfører en websøg...
search_files: Søg rekursivt efter filer og mapper, der matcher et mønster. Se...



### filesystem

read_file: Læs hele indholdet af en fil fra filsystemet. Håndterer...
read_multiple_files: Læs indholdet af flere filer samtidigt. Dette er mere ef..
write_file: Opret en ny fil eller overskriv en eksisterende fil med ..
edit_file: Foretag linjebaserede redigeringer af en tekstfil. Hver redigering erstatter nøjagtigt linje s..
create_directory: Opret en ny mappe eller sørg for, at en mappe eksisterer. Kan oprette m...
list_directory: Få en detaljeret liste over alle filer og mapper i en specificeret sti.
directory_tree: Få en rekursiv trævisning af filer og mapper som en JSON-strukt..
move_file: Flyt eller omdøb filer og mapper. Kan flytte filer mellem dire..
search_files: Søg rekursivt efter filer og mapper, der matcher et mønster. Se..
get_file_info: Hent detaljerede metadata om en fil eller mappe. Returnerer comp.
list_allowed_directories: Returnerer listen over mapper, som denne server har adgang til.