# Digital Registry System on Blockchain

## Overview

BlockRegistry is a decentralized document verification system that combines blockchain technology with traditional web infrastructure. The system stores tamper-proof document hashes on the Ethereum blockchain (or Layer 2 solutions like Polygon) while keeping original documents secure in off-chain storage like IPFS. This hybrid approach ensures document authenticity and immutability while maintaining practical performance and cost-effectiveness.

The application supports multiple authentication methods (Web3 wallets and traditional email/password), role-based access control, and provides both web interface and API endpoints for document registration and verification.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript in a Vite development environment
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query for server state, React Context for authentication and wallet state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt for password hashing
- **File Handling**: Multer for multipart file uploads with memory storage
- **API Design**: RESTful endpoints with role-based middleware protection

### Database Schema
- **Users**: Supports hybrid authentication (email/password + wallet), role-based access (admin, registrar, verifier)
- **Documents**: Stores metadata, file hashes, IPFS references, and blockchain transaction hashes
- **Verification Logs**: Tracks all document verification attempts with timestamps and methods
- **Audit Logs**: Immutable activity logging for compliance
- **QR Codes**: Generated verification links with access tracking

### Blockchain Integration
- **Smart Contract**: Ethereum-compatible registry contract storing document hashes and metadata
- **Hash Algorithm**: Keccak256 for consistent Ethereum-native hashing
- **Web3 Provider**: Ethers.js for blockchain interactions
- **Wallet Support**: MetaMask and WalletConnect integration
- **Network Support**: Configurable for Ethereum mainnet, testnets, or Layer 2 solutions

### Security Architecture
- **Cryptographic Hashing**: Client and server-side file hash computation using keccak256
- **Digital Signatures**: Ethereum signature verification for wallet authentication
- **Role-Based Access Control**: Three-tier permission system (admin/registrar/verifier)
- **Token Management**: JWT with configurable expiration and secure secret handling
- **Input Validation**: Zod schemas for type-safe request/response validation

### File Storage Strategy
- **Local Development**: Memory-based storage with multer
- **Production**: IPFS integration via Pinata or similar service
- **Backup Strategy**: S3-compatible storage as alternative to IPFS
- **File Limits**: 10MB maximum file size with type validation

## External Dependencies

### Blockchain Services
- **Ethereum RPC Provider**: Configurable endpoint for blockchain interactions
- **Smart Contract**: Custom registry contract for document hash storage
- **Wallet Providers**: MetaMask, WalletConnect for user authentication

### Database Services
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

### File Storage Services
- **IPFS/Pinata**: Decentralized file storage for document persistence
- **SendGrid**: Email service for notifications and alerts

### Development Tools
- **Vite**: Build tool with hot module replacement and optimized bundling
- **ESBuild**: Fast TypeScript compilation for production builds
- **Replit Integration**: Cartographer and dev banner plugins for development environment

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent visual elements

### Cryptography and Security
- **Ethers.js**: Ethereum library for wallet interactions and signature verification
- **bcrypt**: Password hashing with configurable salt rounds
- **jsonwebtoken**: JWT token generation and verification
- **QRCode**: QR code generation for verification links