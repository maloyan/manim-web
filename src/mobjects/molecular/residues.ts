/**
 * Residue name tables for protein / nucleic structures.
 *
 * Maps a 3-letter PDB residue name (ALA, GLY, ...) to its 1-letter code. The
 * table covers the 20 standard amino acids plus a few common non-standard
 * residues (SEC, PYL, MSE, ASX, GLX). An unknown residue resolves to 'X'.
 */

/** Fallback 1-letter code for a residue name not in the table. */
export const UNKNOWN_RESIDUE_CODE = 'X';

/**
 * Three-letter residue name to one-letter code.
 *
 * The 20 standard amino acids, plus:
 *  - SEC (selenocysteine) -> U
 *  - PYL (pyrrolysine) -> O
 *  - MSE (selenomethionine) -> M
 *  - ASX (Asn or Asp) -> B
 *  - GLX (Gln or Glu) -> Z
 */
export const THREE_TO_ONE_LETTER: Readonly<Record<string, string>> = {
  ALA: 'A',
  ARG: 'R',
  ASN: 'N',
  ASP: 'D',
  CYS: 'C',
  GLN: 'Q',
  GLU: 'E',
  GLY: 'G',
  HIS: 'H',
  ILE: 'I',
  LEU: 'L',
  LYS: 'K',
  MET: 'M',
  PHE: 'F',
  PRO: 'P',
  SER: 'S',
  THR: 'T',
  TRP: 'W',
  TYR: 'Y',
  VAL: 'V',
  SEC: 'U',
  PYL: 'O',
  MSE: 'M',
  ASX: 'B',
  GLX: 'Z',
};

/**
 * Convert a 3-letter residue name to its 1-letter code.
 *
 * The lookup is case-insensitive. An unknown name resolves to
 * {@link UNKNOWN_RESIDUE_CODE}.
 * @param resName - The residue name (any case).
 * @returns The 1-letter code.
 */
export function threeToOneLetter(resName: string): string {
  const key = resName.trim().toUpperCase();
  return THREE_TO_ONE_LETTER[key] ?? UNKNOWN_RESIDUE_CODE;
}
