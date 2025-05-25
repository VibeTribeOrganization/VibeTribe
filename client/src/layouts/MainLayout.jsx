import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Avatar,
  Badge,
  InputBase,
  Container,
  Autocomplete,
  TextField,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Paper,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  HelpOutline as HelpOutlineIcon,
  Group as FriendsIcon,
  Notifications as NotificationsIcon,
  Add as CreateEventIcon,
  People as UsersIcon,
  Diversity3 as CommunityIcon,
} from "@mui/icons-material";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import eventService from "../services/eventService";
import { useUser } from "../contexts/UserContext";
import userService from "../services/userService";
import messageService from "../services/messageService";

const MainLayout = ({ children }) => {
  const { user, logout, updateUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // useEffect(() => {
  //   // Kullanıcı bilgisi yoksa login sayfasına yönlendir
  //   if (!user && location.pathname !== '/login') {
  //     navigate('/login');
  //   }
  // }, [user, navigate, location]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await messageService.getTotalUnreadCount();
        setUnreadMessageCount(count);
      } catch (err) {
        console.error("Failed to fetch unread messages:", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s'de bir güncelle
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const currentUserRaw = localStorage.getItem("user");
        if (!currentUserRaw) {
          console.warn("localStorage'ta user yok");
          logout();
          return;
        }

        const currentUser = JSON.parse(currentUserRaw);
        if (!currentUser?.username) {
          console.warn("localStorage'taki user objesinde username yok");
          logout();
          return;
        }

        const userProfile = await userService.getUserProfile(
          currentUser.username
        );

        if (
          !user ||
          !user.profilePicture ||
          user.profilePicture !== userProfile.profilePicture
        ) {
          updateUser({
            ...currentUser,
            ...userProfile,
          });
        }
      } catch (error) {
        console.error("Error loading user profile:", error.message);
        logout();
      }
    };

    loadUserProfile();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const handleProfileClick = () => {
    handleClose();
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (currentUser?.username) {
      navigate(`/profile/${currentUser.username}`);
    } else {
      console.error("User information is missing");
      // Kullanıcı bilgisi eksikse login sayfasına yönlendir
      navigate("/login");
    }
  };

  useEffect(() => {
    const fetchCities = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://turkiyeapi.herokuapp.com/api/v1/provinces"
        );
        const result = await response.json();
        if (result.status === "OK" && result.data) {
          const formattedCities = result.data.map((city) => ({
            label: city.name,
            id: city.id,
            region: city.region.tr,
          }));
          setCities(formattedCities);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  const menuItems = [
    { text: "Home", icon: <HomeIcon />, path: "/" },
    { text: "Profile", icon: <PersonIcon />, path: "/profile" },
    { text: "Users", icon: <UsersIcon />, path: "/users" },
    { text: "Friends", icon: <FriendsIcon />, path: "/friends" },
    {
      text: "Notifications",
      icon: <NotificationsIcon />,
      path: "/notifications",
    },
    { text: "Create Event", icon: <CreateEventIcon />, path: "/create-event" },
  ];

  const drawer = (
    <Box sx={{ width: 280 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{ color: "#0284C7", fontWeight: 700 }}
        >
          Vibe Tribe
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const handleSearch = async () => {
    try {
      // Log search parameters for debugging
      console.log("Search Query:", searchQuery);
      console.log("Selected City:", selectedCity?.label);

      const results = await eventService.searchEvents(
        searchQuery,
        selectedCity?.label || null
      );

      // Log results for debugging
      console.log("Search Results:", results);

      // Only navigate to home with search results if we're not already there
      if (location.pathname !== "/") {
        navigate("/", { state: { searchResults: results } });
      } else {
        // If we're already on the home page, we can update the state directly
        window.dispatchEvent(
          new CustomEvent("updateSearchResults", {
            detail: results,
          })
        );
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert(error.message || "Arama sırasında bir hata oluştu");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{ bgcolor: (theme) => theme.palette.background.paper }}
      >
        <Container maxWidth="xl">
          <Toolbar
            sx={{ justifyContent: "space-between", px: { xs: 1, sm: 2 } }}
          >
            {/* Mobile Menu Icon */}
            <IconButton
              sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Typography
              variant="h6"
              component="div"
              onClick={() => navigate("/")}
              sx={{
                fontWeight: 700,
                color: "#0284C7",
                cursor: "pointer",
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
              }}
            >
              Vibe Tribe
            </Typography>

            {/* Search Bar - Hidden on Mobile */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                flex: { xs: "0 1 auto", md: "0 1 500px" },
                mx: { xs: 1, md: 4 },
                position: "relative",
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: (theme) => theme.palette.background.paper,
                  borderRadius: "10px",
                  flex: 1,
                  height: "42px",
                  overflow: "hidden",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  "&:hover": {
                    border: "1px solid #CBD5E1",
                  },
                }}
              >
                {/* Activity Search */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 1.5,
                    flex: 1,
                    height: "100%",
                  }}
                >
                  <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                  <InputBase
                    placeholder="Etkinlikleri ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    sx={{
                      flex: 1,
                      fontSize: "0.9rem",
                      ml: 1,
                      "& input": {
                        padding: "0px",
                      },
                    }}
                  />
                </Box>

                {/* City Search */}
                <Box
                  sx={{
                    borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
                    width: "200px",
                    height: "100%",
                  }}
                >
                  <Autocomplete
                    size="small"
                    options={cities}
                    value={selectedCity}
                    onChange={(event, newValue) => {
                      setSelectedCity(newValue);
                    }}
                    loading={loading}
                    openOnFocus={false}
                    blurOnSelect
                    popupIcon={null}
                    sx={{
                      height: "100%",
                      "& .MuiOutlinedInput-root": {
                        height: "40px",
                        "& fieldset": {
                          border: "none",
                        },
                      },
                      "& .MuiAutocomplete-input": {
                        fontSize: "0.9rem",
                        padding: "7px 8px !important",
                      },
                    }}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Şehir" />
                    )}
                  />
                </Box>

                {/* Search Button */}
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  sx={{
                    background: "#0EA5E9",
                    "&:hover": {
                      background: "#0284C7",
                    },
                    borderRadius: "0",
                    textTransform: "none",
                    height: "42px",
                    minWidth: "40px",
                    width: "40px",
                    padding: 0,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 24 }} />
                </Button>
              </Paper>
            </Box>

            {/* Right Actions */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 2 },
              }}
            >
              {/* Search Icon - Only on Mobile */}
              <IconButton
                size="large"
                sx={{
                  display: { xs: "flex", md: "none" },
                  color: "text.primary",
                }}
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              >
                <SearchIcon />
              </IconButton>

              <Button
                variant="contained"
                startIcon={<CreateEventIcon />}
                onClick={() => navigate("/create-event")}
                sx={{
                  display: { xs: "none", sm: "flex" },
                  background:
                    "linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)",
                  },
                  borderRadius: "8px",
                  textTransform: "none",
                  px: 2,
                }}
              >
                Etkinlik Oluştur
              </Button>

              <IconButton
  size="large"
  sx={(theme) => ({
    display: { xs: "none", md: "flex" },
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      boxShadow: `0 0 0 3px ${theme.palette.primary.main}33`, // hafif glow
      borderRadius: '50%',
    },
  })}
  onClick={() => navigate("/users")}
  title="Kullanıcılar"
>
                <CommunityIcon />
              </IconButton>

            <IconButton
  size="large"
  sx={(theme) => ({
    display: { xs: "none", md: "flex" },
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      boxShadow: `0 0 0 3px ${theme.palette.primary.main}33`,
      borderRadius: '50%',
    },
  })}
  onClick={() => navigate("/friends")}
>
  <Badge badgeContent={unreadMessageCount} color="error">
    <ChatBubbleIcon />
  </Badge>
</IconButton>
              <IconButton
  size="large"
  sx={(theme) => ({
    display: { xs: "none", md: "flex" },
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      boxShadow: `0 0 0 3px ${theme.palette.primary.main}33`,
      borderRadius: '50%',
    },
  })}
  onClick={() => navigate("/notifications")}
>
  <Badge badgeContent={5} color="error">
    <NotificationsIcon />
  </Badge>
</IconButton>

              <IconButton
                sx={{ p: 0 }}
                onClick={handleClick}
                aria-controls={open ? "profile-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
              >
                <Avatar
                  src={
                    user?.profilePicture
                      ? `${process.env.REACT_APP_API_BASE_URL}/users/profile-picture/${user.profilePicture}`
                      : null
                  }
                  alt={user?.name || user?.username || "?"}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#0EA5E9",
                    color: "white",
                    fontWeight: 500,
                  }}
                >
                  {user?.name
                    ? user.name[0].toUpperCase()
                    : user?.username
                    ? user.username[0].toUpperCase()
                    : "?"}
                </Avatar>
              </IconButton>
              <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{
                  elevation: 0,
                  sx: (theme) => ({
                    overflow: "visible",
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
                    mt: 1,
                    width: 180,
                    "& .MuiMenuItem-root": {
                      fontSize: "0.875rem",
                      minHeight: "36px",
                      px: 2,
                      py: 0.5,
                      gap: 1.5,
                      color: theme.palette.text.primary,
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                      "& .MuiSvgIcon-root": {
                        fontSize: "1.1rem",
                        color: theme.palette.text.secondary,
                      },
                    },
                    "& .MuiDivider-root": {
                      my: 0.5,
                      borderColor: theme.palette.divider,
                    },
                  }),
                }}
              >
                <MenuItem onClick={handleProfileClick}>
                  <PersonIcon fontSize="small" />
                  Profili görüntüle
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    navigate("/settings");
                  }}
                >
                  <SettingsIcon fontSize="small" />
                  Ayarlar
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    navigate("/help");
                  }}
                >
                  <HelpOutlineIcon fontSize="small" />
                  Yardım
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" />
                  Çıkış yap
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>

          {/* Mobile Search Panel */}
          <Collapse in={mobileSearchOpen} timeout={300}>
            <Box
              sx={{
                py: 2,
                px: 2,
                display: { xs: "flex", md: "none" },
                flexDirection: "column",
                gap: 2,
                bgcolor: "white",
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: (theme) => theme.palette.background.paper,
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  "&:hover": {
                    border: "1px solid #CBD5E1",
                  },
                }}
              >
                {/* Mobile Activity Search */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 1.5,
                    flex: 1,
                    height: "42px",
                  }}
                >
                  <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                  <InputBase
                    placeholder="Etkinlikleri ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    sx={{
                      flex: 1,
                      fontSize: "0.9rem",
                      ml: 1,
                      "& input": {
                        padding: "0px",
                      },
                    }}
                  />
                </Box>

                {/* Mobile City Search */}
                <Box
                  sx={{
                    borderLeft: "1px solid #E2E8F0",
                    width: "140px",
                  }}
                >
                  <Autocomplete
                    size="small"
                    options={cities}
                    value={selectedCity}
                    onChange={(event, newValue) => {
                      setSelectedCity(newValue);
                    }}
                    loading={loading}
                    openOnFocus={false}
                    blurOnSelect
                    popupIcon={null}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "40px",
                        "& fieldset": {
                          border: "none",
                        },
                      },
                      "& .MuiAutocomplete-input": {
                        fontSize: "0.9rem",
                        padding: "7px 8px !important",
                      },
                    }}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Şehir" />
                    )}
                  />
                </Box>

                {/* Mobile Search Button */}
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  sx={{
                    background: "#0EA5E9",
                    "&:hover": {
                      background: "#0284C7",
                    },
                    borderRadius: "0",
                    textTransform: "none",
                    height: "42px",
                    minWidth: "40px",
                    width: "40px",
                    padding: 0,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 20 }} />
                </Button>
              </Paper>
            </Box>
          </Collapse>
        </Container>
      </AppBar>

      {/* Drawer - Mobile Menu */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: (theme) => theme.palette.background.default,
          mt: {
            xs: mobileSearchOpen ? "calc(64px + 140px)" : "64px",
            md: "64px",
          },
          minHeight: "calc(100vh - 64px)",
          transition: "margin-top 300ms ease-in-out",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
