/**
 * [![npm version](https://img.shields.io/npm/v/tonal-chord.svg)](https://www.npmjs.com/package/tonal-chord)
 * [![tonal](https://img.shields.io/badge/tonal-chord-yellow.svg)](https://www.npmjs.com/browse/keyword/tonal)
 *
 * `tonal-chord` is a collection of functions to manipulate musical chords
 *
 * This is part of [tonal](https://www.npmjs.com/package/tonal) music theory library.
 *
 * @example
 * const chord = require('tonal-chord')
 * chord.notes('CMaj7') // => ['C', 'E', 'G', 'B']
 *
 * @module chord
 */
import { tokenize as split } from "tonal-note";
import { transpose } from "tonal-distance";
import { chord } from "tonal-dictionary";
import { chroma, isSubsetOf, isSupersetOf } from "tonal-pcset";

/**
 * Return the available chord names
 *
 * @function
 * @param {boolean} aliases - true to include aliases
 * @return {Array} the chord names
 *
 * @example
 * import * as chord from 'tonal-chord'
 * chord.names() // => ['maj7', ...]
 */
export const names = chord.names;

const NO_CHORD = Object.freeze({
  name: null,
  names: [],
  intervals: [],
  chroma: null,
  setnum: null
});

const properties = name => {
  const intervals = chord(name);
  if (!intervals) return NO_CHORD;
  const s = { intervals, name };
  s.chroma = chroma(intervals);
  s.setnum = parseInt(s.chroma, 2);
  s.names = chord.names(s.chroma);
  return s;
};

const memo = (fn, cache = {}) => str => cache[str] || (cache[str] = fn(str));

/**
 * Get chord properties. It returns an object with:
 * 
 * - name: the chord name
 * - names: a list with all possible names (includes the current)
 * - intervals: an array with the chord intervals
 * - chroma:  chord croma (see pcset)
 * - setnum: chord chroma number
 * 
 * @function
 * @param {String} name - the chord name (without tonic)
 * @return {Object} an object with the properties or a object with all properties
 * set to null if not valid chord name
 */
export const props = memo(properties);

/**
 * Get chord intervals. It always returns an array
 * 
 * @function
 * @param {String} name - the chord name (optionally a tonic and type)
 * @return {Array<String>} a list of intervals or null if the type is not known
 */
export const intervals = name => props(tokenize(name)[1]).intervals;

/**
 * Get the chord notes of a chord. This function accepts either a chord name
 * (for example: 'Cmaj7') or a list of notes.
 *
 * It always returns an array, even if the chord is not found.
 *
 * @function
 * @param {String} nameOrTonic - name of the chord or the tonic
 * @return [String] name - (Optional) name if the first parameter is the tonic
 *
 * @example
 * chord.notes('Cmaj7') // => ['C', 'E', 'G', 'B']
 * chord.notes('C', 'maj7') // => ['C', 'E', 'G', 'B']
 */
export function notes(nameOrTonic, name) {
  const p = tokenize(nameOrTonic);
  name = name || p[1];
  return intervals(name).map(transpose(p[0]));
}

/**
 * Check if a given name correspond to a chord in the dictionary
 * 
 * @function
 * @param {String} name
 * @return {Boolean}
 * @example
 * chord.exists('CMaj7') // => true
 * chord.exists('Maj7') // => true
 * chord.exists('Ablah') // => false
 */
export const exists = name => chord(tokenize(name)[1]) !== undefined;

/**
 * Get all chords names that are a superset of the given one
 * (has the same notes and at least one more)
 * 
 * @function
 * @param {String} name 
 * @return {Array} a list of chord names
 */
export const supersets = name => {
  if (!intervals(name).length) return [];
  const isSuperset = isSupersetOf(intervals(name));
  return chord.names().filter(name => isSuperset(chord(name)));
};

/**
 * Find all chords names that are a subset of the given one
 * (has less notes but all from the given chord)
 * 
 * @function
 * @param {String} name 
 * @return {Array} a list of chord names
 */
export const subsets = name => {
  const isSubset = isSubsetOf(intervals(name));
  return chord.names().filter(name => isSubset(chord(name)));
};

/**
 * Tokenize a chord name. It returns an array with the tonic and chord type 
 * If not tonic is found, all the name is considered the chord name.
 *
 * This function does NOT check if the chord type exists or not. It only tries
 * to split the tonic and chord type.
 *
 * @function
 * @param {String} name - the chord name
 * @return {Array} an array with [type, tonic]
 * @example
 * chord.tokenize('Cmaj7') // => [ 'C', 'maj7' ]
 * chord.tokenize('C7') // => [ 'C', '7' ]
 * chord.tokenize('mMaj7') // => [ null, 'mMaj7' ]
 * chord.tokenize('Cnonsense') // => [ 'C', 'nonsense' ]
 */
export function tokenize(name) {
  const p = split(name);
  if (p[0] === "") return [null, name];

  // 6 and 7 is consider part of the chord
  if (p[0] !== "" && (p[2][0] === "6" || p[2][0] === "7")) {
    return [p[0] + p[1], p[2] + p[3]];
  } else {
    return [p[0] + p[1] + p[2], p[3]];
  }
}
