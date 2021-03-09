-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- Gazdă: 127.0.0.1
-- Timp de generare: mart. 09, 2021 la 07:37 AM
-- Versiune server: 10.4.17-MariaDB
-- Versiune PHP: 8.0.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Bază de date: `ctg`
--

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `absenta`
--

CREATE TABLE `absenta` (
  `numar_matricol` int(11) NOT NULL,
  `disciplina` tinytext NOT NULL,
  `data` tinytext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `clasa`
--

CREATE TABLE `clasa` (
  `clasa` tinytext NOT NULL,
  `materie` tinytext NOT NULL,
  `profesor` tinytext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `elev`
--

CREATE TABLE `elev` (
  `numar_matricol` tinytext NOT NULL,
  `nume` tinytext NOT NULL,
  `prenume` tinytext NOT NULL,
  `clasa` tinytext NOT NULL,
  `email` tinytext NOT NULL,
  `domiciliu` tinytext NOT NULL,
  `p1_nume` tinytext NOT NULL,
  `p1_prenume` tinytext NOT NULL,
  `p1_telefon` tinytext NOT NULL,
  `p1_email` tinytext NOT NULL,
  `p2_nume` tinytext NOT NULL,
  `p2_prenume` tinytext NOT NULL,
  `p2_telefon` tinytext NOT NULL,
  `p2_email` tinytext NOT NULL,
  `mentiuni` text NOT NULL,
  `password` tinytext NOT NULL,
  `p1_password` tinytext NOT NULL,
  `p2_password` tinytext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `nota`
--

CREATE TABLE `nota` (
  `numar_matricol` int(6) NOT NULL,
  `disciplina` tinytext NOT NULL,
  `nota` int(11) NOT NULL,
  `data` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `session`
--

CREATE TABLE `session` (
  `numar_matricol` int(11) NOT NULL,
  `sid` tinytext NOT NULL,
  `clasa` tinytext NOT NULL,
  `last` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `status`
--

CREATE TABLE `status` (
  `numar_matricol` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `data` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
