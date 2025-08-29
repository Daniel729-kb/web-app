# 🚛 LogiMap - Logistics Map Generator

## Overview
LogiMap is a powerful web application for visualizing and managing complex logistics networks. It allows users to create interactive maps showing the flow of goods from suppliers through warehouses to final destinations.

## Features

### Core Functionality
- **Multi-Facility Management**: Support for 5 different facility types with customizable properties
- **Transport Route Visualization**: Visual connections between facilities with transport mode indicators
- **Warehouse Management**: Special features for warehouse facilities including:
  - Temperature/humidity control settings
  - Warehouse type classification (General/Bonded)
  - Operating entity tracking
- **Multi-language Support**: Available in Japanese, English, and Chinese
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Import/Export**: CSV import/export for bulk data management
- **Image Export**: Export your logistics map as an image

### Technical Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Performance Optimized**: Efficient rendering with debouncing and caching
- **Local Storage**: Saves your work automatically
- **Modular Architecture**: Clean separation of concerns with multiple JS/CSS modules

## Quick Start

1. Open `index.html` in a modern web browser
2. Add facilities using the "+" buttons in each section
3. Configure facility properties (name, location, type)
4. Add transport routes between facilities
5. Export your map as an image or CSV

## File Structure

```
logimap/
├── index.html              # Main application file
├── logimap-core.js        # Core business logic
├── logimap-layout.js      # Layout management
├── logimap-components.css # Component styles
├── logimap-layout.css     # Layout styles
├── logimap-map.css        # Map visualization styles
└── README.md              # Documentation
```

## Data Management

### CSV Import Format
The application supports CSV import with the following columns:
- Facility Type (1-5)
- Name
- Location Type (domestic/overseas)
- Country
- City
- Is Warehouse (true/false)
- Warehouse Type (general/bonded)
- Operating Entity (own/other/new)
- Temperature Control (true/false)
- Temperature Range
- Humidity Range
- Work Content

### Local Storage
The application automatically saves your work to browser local storage, including:
- All facility data
- Transport routes
- UI preferences (theme, language, collapsed sections)

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Issues
- Large datasets (100+ facilities) may experience performance degradation
- Some icons may not display correctly on older browsers

## Future Enhancements
- Real-time collaboration
- Database backend integration
- Advanced routing algorithms
- Cost calculation features
- GPS coordinate support
- Mobile app version

## License
Internal use only - Proprietary software

## Support
For issues or feature requests, please contact the development team.