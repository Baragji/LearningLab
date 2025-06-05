"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton as Button } from "@/components/ui/AppButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Filter,
  BookOpen,
  Layers,
  FileText,
  Tag,
  BarChart3,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Difficulty, CourseStatus } from "@prisma/client";

// Søgeresultat typer
interface Course {
  id: number;
  title: string;
  description: string;
  slug: string;
  difficulty: Difficulty;
  status: CourseStatus;
  tags: string[];
  image: string | null;
  estimatedHours: number | null;
  subjectArea: {
    id: number;
    name: string;
    slug: string;
  };
  relevanceScore: number;
}

interface Module {
  id: number;
  title: string;
  description: string;
  courseId: number;
  course: {
    id: number;
    title: string;
    slug: string;
  };
  relevanceScore: number;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  moduleId: number;
  module: {
    id: number;
    title: string;
    courseId: number;
    course: {
      id: number;
      title: string;
      slug: string;
    };
  };
  relevanceScore: number;
}

interface SearchResults {
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SearchPage = () => {
  const { apiClient } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get search parameters from URL
  const initialQuery = searchParams?.get("q") || "";
  const initialType =
    (searchParams?.get("type") as "course" | "module" | "lesson" | "all") ||
    "all";
  const initialTags = searchParams?.get("tags") || "";
  const initialDifficulty = searchParams?.get("difficulty") as
    | Difficulty
    | undefined;
  const initialSubjectAreaId = searchParams?.get("subjectAreaId")
    ? parseInt(searchParams?.get("subjectAreaId")!)
    : undefined;

  // State for search parameters
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<
    "course" | "module" | "lesson" | "all"
  >(initialType);
  const [searchTags, setSearchTags] = useState(initialTags);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(
    initialDifficulty,
  );
  const [subjectAreaId, setSubjectAreaId] = useState<number | undefined>(
    initialSubjectAreaId,
  );

  // State for search results
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // State for subject areas (for filter)
  const [subjectAreas, setSubjectAreas] = useState<
    { id: number; name: string }[]
  >([]);
  const [isLoadingSubjectAreas, setIsLoadingSubjectAreas] = useState(true);

  // State for active tab
  const [activeTab, setActiveTab] = useState<
    "all" | "courses" | "modules" | "lessons"
  >(
    initialType === "all"
      ? "all"
      : initialType === "course"
        ? "courses"
        : initialType === "module"
          ? "modules"
          : "lessons",
  );

  // Fetch subject areas for filter
  useEffect(() => {
    const fetchSubjectAreas = async () => {
      if (!apiClient) return;

      try {
        const response = await apiClient.get("/api/subject-areas");
        setSubjectAreas(
          response.data.subjectAreas.map((area: any) => ({
            id: area.id,
            name: area.name,
          })),
        );
      } catch (error) {
        console.error("Fejl ved hentning af fagområder:", error);
      } finally {
        setIsLoadingSubjectAreas(false);
      }
    };

    fetchSubjectAreas();
  }, [apiClient]);

  // Perform search
  const performSearch = useCallback(
    async (page = 1) => {
      if (!apiClient) return;

      setIsSearching(true);
      try {
        let url = `/api/search?page=${page}&limit=10`;

        if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;
        if (searchType !== "all") url += `&type=${searchType}`;
        if (searchTags) url += `&tags=${encodeURIComponent(searchTags)}`;
        if (difficulty) url += `&difficulty=${difficulty}`;
        if (subjectAreaId) url += `&subjectAreaId=${subjectAreaId}`;

        const response = await apiClient.get(url);
        setResults(response.data);
        setCurrentPage(page);

        // Update URL
        updateSearchParams({
          q: searchQuery,
          type: searchType !== "all" ? searchType : undefined,
          tags: searchTags || undefined,
          difficulty: difficulty,
          subjectAreaId: subjectAreaId?.toString(),
          page: page > 1 ? page.toString() : undefined,
        });
      } catch (error) {
        console.error("Fejl ved søgning:", error);
        toast.error("Der opstod en fejl ved søgningen");
      } finally {
        setIsSearching(false);
      }
    },
    [apiClient, searchQuery, searchType, searchTags, difficulty, subjectAreaId],
  );

  // Perform search when URL parameters change or performSearch dependencies change
  useEffect(() => {
    if (initialQuery) {
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialQuery,
    initialType,
    initialTags,
    initialDifficulty,
    initialSubjectAreaId,
    performSearch,
  ]);

  // Update URL with search parameters
  const updateSearchParams = (params: Record<string, string | undefined>) => {
    const url = new URL(window.location.href);

    // Clear existing search params
    url.searchParams.delete("q");
    url.searchParams.delete("type");
    url.searchParams.delete("tags");
    url.searchParams.delete("difficulty");
    url.searchParams.delete("subjectAreaId");
    url.searchParams.delete("page");

    // Add new search params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });

    // Update URL without reloading the page
    window.history.pushState({}, "", url.toString());
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(1);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | "courses" | "modules" | "lessons");

    // Update search type based on tab
    const newType =
      value === "all"
        ? "all"
        : value === "courses"
          ? "course"
          : value === "modules"
            ? "module"
            : "lesson";

    setSearchType(newType);
    performSearch(1);
  };

  // Get difficulty label
  const getDifficultyLabel = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.BEGINNER:
        return "Begynder";
      case Difficulty.INTERMEDIATE:
        return "Øvet";
      case Difficulty.ADVANCED:
        return "Avanceret";
      default:
        return difficulty;
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.BEGINNER:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case Difficulty.INTERMEDIATE:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case Difficulty.ADVANCED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Avanceret søgning</h1>

      {/* Search form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Søg efter indhold</CardTitle>
          <CardDescription>
            Søg på tværs af kurser, moduler og lektioner
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSearch}>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søg efter kurser, moduler eller lektioner..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Søger...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Søg
                  </>
                )}
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Indholdstype
                </label>
                <Select
                  value={searchType}
                  onValueChange={(value) =>
                    setSearchType(
                      value as "course" | "module" | "lesson" | "all",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle typer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle typer</SelectItem>
                    <SelectItem value="course">Kurser</SelectItem>
                    <SelectItem value="module">Moduler</SelectItem>
                    <SelectItem value="lesson">Lektioner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Tags (kommasepareret)
                </label>
                <Input
                  placeholder="f.eks. javascript,react,web"
                  value={searchTags}
                  onChange={(e) => setSearchTags(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Sværhedsgrad
                </label>
                <Select
                  value={difficulty || ""}
                  onValueChange={(value) =>
                    setDifficulty((value as Difficulty) || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle sværhedsgrader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle sværhedsgrader</SelectItem>
                    <SelectItem value={Difficulty.BEGINNER}>
                      Begynder
                    </SelectItem>
                    <SelectItem value={Difficulty.INTERMEDIATE}>
                      Øvet
                    </SelectItem>
                    <SelectItem value={Difficulty.ADVANCED}>
                      Avanceret
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Fagområde
                </label>
                <Select
                  value={subjectAreaId?.toString() || ""}
                  onValueChange={(value) =>
                    setSubjectAreaId(value ? parseInt(value) : undefined)
                  }
                  disabled={isLoadingSubjectAreas}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle fagområder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle fagområder</SelectItem>
                    {subjectAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Search results */}
      {isSearching && !results ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : results ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              {results.total} {results.total === 1 ? "resultat" : "resultater"}
              {searchQuery && ` for "${searchQuery}"`}
            </h2>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Search size={16} />
                <span>Alle resultater</span>
                {results.total > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {results.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen size={16} />
                <span>Kurser</span>
                {results.courses.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {searchType === "course"
                      ? results.total
                      : results.courses.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="modules" className="flex items-center gap-2">
                <Layers size={16} />
                <span>Moduler</span>
                {results.modules.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {searchType === "module"
                      ? results.total
                      : results.modules.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="lessons" className="flex items-center gap-2">
                <FileText size={16} />
                <span>Lektioner</span>
                {results.lessons.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {searchType === "lesson"
                      ? results.total
                      : results.lessons.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {results.courses.length === 0 &&
              results.modules.length === 0 &&
              results.lessons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Ingen resultater fundet</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Courses section */}
                  {results.courses.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold flex items-center">
                          <BookOpen className="h-5 w-5 mr-2" />
                          Kurser
                        </h3>
                        {results.courses.length <
                          (searchType === "course" ? results.total : 3) && (
                          <Button
                            variant="link"
                            onClick={() => {
                              setSearchType("course");
                              setActiveTab("courses");
                              performSearch(1);
                            }}
                          >
                            Se alle kurser
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.courses.map((course) => (
                          <Card key={course.id} className="overflow-hidden">
                            {course.image && (
                              <div className="h-40 overflow-hidden">
                                <Image
                                  src={course.image}
                                  alt={course.title}
                                  width={400}
                                  height={160}
                                  className="w-full h-full object-cover transition-transform hover:scale-105"
                                />
                              </div>
                            )}
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">
                                  {course.title}
                                </CardTitle>
                                {course.difficulty && (
                                  <Badge
                                    className={getDifficultyColor(
                                      course.difficulty,
                                    )}
                                  >
                                    {getDifficultyLabel(course.difficulty)}
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>
                                {course.subjectArea.name}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <p className="line-clamp-2 text-sm">
                                {course.description}
                              </p>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-2">
                              <div className="flex items-center text-sm text-muted-foreground">
                                {course.estimatedHours && (
                                  <div className="flex items-center mr-4">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {course.estimatedHours} timer
                                  </div>
                                )}
                                {course.tags && course.tags.length > 0 && (
                                  <div className="flex items-center">
                                    <Tag className="h-4 w-4 mr-1" />
                                    {course.tags.slice(0, 2).join(", ")}
                                    {course.tags.length > 2 && "..."}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/courses/${course.slug}`)
                                }
                              >
                                Se kursus
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modules section */}
                  {results.modules.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold flex items-center">
                          <Layers className="h-5 w-5 mr-2" />
                          Moduler
                        </h3>
                        {results.modules.length <
                          (searchType === "module" ? results.total : 3) && (
                          <Button
                            variant="link"
                            onClick={() => {
                              setSearchType("module");
                              setActiveTab("modules");
                              performSearch(1);
                            }}
                          >
                            Se alle moduler
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {results.modules.map((module) => (
                          <Card key={module.id}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">
                                {module.title}
                              </CardTitle>
                              <CardDescription>
                                Fra kurset: {module.course.title}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <p className="line-clamp-2 text-sm">
                                {module.description}
                              </p>
                            </CardContent>
                            <CardFooter className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/courses/${module.course.slug}/modules/${module.id}`,
                                  )
                                }
                              >
                                Se modul
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lessons section */}
                  {results.lessons.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          Lektioner
                        </h3>
                        {results.lessons.length <
                          (searchType === "lesson" ? results.total : 3) && (
                          <Button
                            variant="link"
                            onClick={() => {
                              setSearchType("lesson");
                              setActiveTab("lessons");
                              performSearch(1);
                            }}
                          >
                            Se alle lektioner
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {results.lessons.map((lesson) => (
                          <Card key={lesson.id}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">
                                {lesson.title}
                              </CardTitle>
                              <CardDescription>
                                Fra kurset: {lesson.module.course.title} /
                                Modul: {lesson.module.title}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <p className="line-clamp-2 text-sm">
                                {lesson.description}
                              </p>
                            </CardContent>
                            <CardFooter className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/courses/${lesson.module.course.slug}/modules/${lesson.module.id}/lessons/${lesson.id}`,
                                  )
                                }
                              >
                                Se lektion
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="courses">
              {results.courses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Ingen kurser fundet</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.courses.map((course) => (
                      <Card key={course.id} className="overflow-hidden">
                        {course.image && (
                          <div className="h-40 overflow-hidden">
                            <Image
                              src={course.image}
                              alt={course.title}
                              width={400}
                              height={160}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">
                              {course.title}
                            </CardTitle>
                            {course.difficulty && (
                              <Badge
                                className={getDifficultyColor(
                                  course.difficulty,
                                )}
                              >
                                {getDifficultyLabel(course.difficulty)}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {course.subjectArea.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="line-clamp-2 text-sm">
                            {course.description}
                          </p>
                          {course.tags && course.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {course.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            {course.estimatedHours && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {course.estimatedHours} timer
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/courses/${course.slug}`)
                            }
                          >
                            Se kursus
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {results.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-8">
                      <div className="text-sm text-muted-foreground">
                        Viser {(results.page - 1) * results.limit + 1}-
                        {Math.min(results.page * results.limit, results.total)}{" "}
                        af {results.total} kurser
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={results.page === 1}
                          onClick={() => performSearch(results.page - 1)}
                        >
                          Forrige
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={results.page === results.totalPages}
                          onClick={() => performSearch(results.page + 1)}
                        >
                          Næste
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="modules">
              {results.modules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Ingen moduler fundet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {results.modules.map((module) => (
                      <Card key={module.id}>
                        <CardHeader>
                          <CardTitle>{module.title}</CardTitle>
                          <CardDescription>
                            Fra kurset: {module.course.title}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p>{module.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                          <Button
                            onClick={() =>
                              router.push(
                                `/courses/${module.course.slug}/modules/${module.id}`,
                              )
                            }
                          >
                            Se modul
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {results.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-8">
                      <div className="text-sm text-muted-foreground">
                        Viser {(results.page - 1) * results.limit + 1}-
                        {Math.min(results.page * results.limit, results.total)}{" "}
                        af {results.total} moduler
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={results.page === 1}
                          onClick={() => performSearch(results.page - 1)}
                        >
                          Forrige
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={results.page === results.totalPages}
                          onClick={() => performSearch(results.page + 1)}
                        >
                          Næste
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="lessons">
              {results.lessons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Ingen lektioner fundet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {results.lessons.map((lesson) => (
                      <Card key={lesson.id}>
                        <CardHeader>
                          <CardTitle>{lesson.title}</CardTitle>
                          <CardDescription>
                            Fra kurset: {lesson.module.course.title} / Modul:{" "}
                            {lesson.module.title}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p>{lesson.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                          <Button
                            onClick={() =>
                              router.push(
                                `/courses/${lesson.module.course.slug}/modules/${lesson.module.id}/lessons/${lesson.id}`,
                              )
                            }
                          >
                            Se lektion
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {results.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-8">
                      <div className="text-sm text-muted-foreground">
                        Viser {(results.page - 1) * results.limit + 1}-
                        {Math.min(results.page * results.limit, results.total)}{" "}
                        af {results.total} lektioner
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={results.page === 1}
                          onClick={() => performSearch(results.page - 1)}
                        >
                          Forrige
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={results.page === results.totalPages}
                          onClick={() => performSearch(results.page + 1)}
                        >
                          Næste
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Indtast en søgning for at finde indhold</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
