import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  LogOut,
  Package,
  FileText,
  Shield,
  Settings,
  LayoutDashboard, // ADDED: Icon for the admin button
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleFavourites = () => {
    navigate("/favourites");
  };

  const handleMyOrders = () => {
    navigate("/my-orders");
  };

  const handlePersonalDetails = () => {
    navigate("/personal-details");
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/shrifal.svg"
              alt="Shrifal-Handicrafts"
              className="h-12 sm:h-16 lg:h-20 w-auto"
            />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary truncate max-w-[120px] sm:max-w-none">
              Shrifal-Handicrafts
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 xl:space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base font-medium"
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base font-medium"
            >
              Shop
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base font-medium"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base font-medium"
            >
              Contact
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* ADDED: Admin Dashboard Button (Desktop) */}
            {user && user.role === "admin" && (
              <Link to="/admin" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-sm lg:text-base"
                >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              </Link>
            )}

            {/* User Menu / Login */}
            {user ? (
              <div className="hidden md:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 lg:h-9 lg:w-9 rounded-full"
                    >
                      <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs lg:text-sm">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 sm:w-56"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">
                          {user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleMyOrders}
                      className="cursor-pointer"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleFavourites}
                      className="cursor-pointer"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favourites</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handlePersonalDetails}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Personal Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/terms-conditions" className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Terms & Conditions</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/privacy-policy" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Privacy Policy</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex items-center text-sm lg:text-base"
                >
                  <User className="h-4 w-4 mr-1" />
                  Login
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="sm" className="relative p-2">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs font-medium">
                    {getTotalItems() > 99 ? "99+" : getTotalItems()}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-3 sm:py-4 bg-white">
            <nav className="flex flex-col space-y-3 sm:space-y-4">
              {/* Navigation Links */}
              <Link
                to="/"
                className="text-gray-700 hover:text-primary transition-colors py-2 px-1 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/shop"
                className="text-gray-700 hover:text-primary transition-colors py-2 px-1 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-primary transition-colors py-2 px-1 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-primary transition-colors py-2 px-1 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>

              {/* User Section */}
              {user ? (
                <div className="flex flex-col space-y-3 pt-3 sm:pt-4 border-t border-gray-200">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 py-2">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium truncate">
                        {user.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* MODIFIED: User Menu Items Wrapper */}
                  <div className="flex flex-col space-y-3 border-t border-gray-200 pt-3">
                    {/* ADDED: Admin Dashboard Link (Mobile) */}
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center text-gray-700 hover:text-primary transition-colors py-2 px-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                        <span className="text-sm sm:text-base font-medium">
                          Admin Dashboard
                        </span>
                      </Link>
                    )}

                    {/* Regular user menu items */}
                    <button
                      onClick={() => {
                        handleMyOrders();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center text-gray-700 hover:text-primary transition-colors py-2 px-1 text-left"
                    >
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                      <span className="text-sm sm:text-base">My Orders</span>
                    </button>
                    <button
                      onClick={() => {
                        handleFavourites();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center text-gray-700 hover:text-primary transition-colors py-2 px-1 text-left"
                    >
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                      <span className="text-sm sm:text-base">Favourites</span>
                    </button>
                    <button
                      onClick={() => {
                        handlePersonalDetails();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center text-gray-700 hover:text-primary transition-colors py-2 px-1 text-left"
                    >
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                      <span className="text-sm sm:text-base">
                        Personal Details
                      </span>
                    </button>
                    <Link
                      to="/terms-conditions"
                      className="flex items-center text-gray-700 hover:text-primary transition-colors py-2 px-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                      <span className="text-sm sm:text-base">
                        Terms & Conditions
                      </span>
                    </Link>
                    <Link
                      to="/privacy-policy"
                      className="flex items-center text-gray-700 hover:text-primary transition-colors py-2 px-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                      <span className="text-sm sm:text-base">
                        Privacy Policy
                      </span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center text-red-600 hover:text-red-700 transition-colors py-2 px-1 text-left border-t border-gray-200 mt-2 pt-4"
                    >
                      <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                      <span className="text-sm sm:text-base">Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center text-gray-700 hover:text-primary transition-colors py-3 px-1 border-t border-gray-200 mt-2 pt-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                  <span className="text-sm sm:text-base font-medium">
                    Login
                  </span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
