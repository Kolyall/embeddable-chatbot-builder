// Shared design-system components reused across apps/app, apps/admin, and
// apps/landing. Built on Radix primitives + Tailwind tokens defined in each
// app's globals.css (see Phase 8 of the implementation plan, revised for
// the Parrot rebrand/redesign pass).
export { Button, type ButtonVariant } from "./components/button";
export { Badge, type BadgeTone } from "./components/badge";
export { TextField } from "./components/text-field";
export { Input } from "./components/input";
export { Textarea } from "./components/textarea";
export { Label } from "./components/label";
export { LogoutButton } from "./components/logout-button";
export { LoadingSpinner } from "./components/loading-spinner";
export { ErrorState } from "./components/error-state";
export { ParrotMark } from "./components/parrot-mark";
export { Skeleton } from "./components/skeleton";
export { Toaster } from "./components/sonner";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/card";
export { Separator } from "./components/separator";
export { Avatar, AvatarFallback } from "./components/avatar";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/tabs";
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/dialog";
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./components/tooltip";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./components/dropdown-menu";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
} from "./components/select";
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./components/table";
export { cn } from "./lib/cn";
