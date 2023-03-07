/**
 * @license
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Nick Williams
 * Copyright (c) 2021 Jack Holloway
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { uniq } from "./lowdash/uniq.js";

/**
 * generates factory functions to convert table rows to objects,
 * based on the titles in the table's <thead>
 * @param  {Array<String>} headings the values of the table's <thead>
 * @return {(row: HTMLTableRowElement) => Object} a function that takes a table row and spits out an object
 */
function mapRow(headings, highSplit = false) {
  return function mapRowToObject({ cells }) {
    const lowCells = [...cells];
    const highCells = lowCells.length > headings.length
      ? lowCells.splice(Math.ceil(lowCells.length / 2))
      : [];
    const range = highSplit ? highCells : lowCells;

    return range.reduce((result, cell, i) => {
      const input = cell.querySelector("input,select");
      var value;

      if (input) {
        value = input.type === "checkbox" ? input.checked : input.value;
      } else {
        value = cell.innerHTML;
      }

      return Object.assign(result, { [headings[i]]: value });
    }, {});
  };
}

/**
 * given a table, generate an array of keys/column names
 *
 * @param  {HTMLTableElement} table the table to convert
 * @return {Array<String>}       array of strings representing each header in the table
 */
export function getHeadings(table, unique = true) {
  if (!table.tHead || table.tHead.rows.length === 0) return [];
  const headings = [...table.tHead.rows[0].cells].map((heading) => {
    return heading.textContent;
  }); // .filter((h) => h.trim() !== "");

  if (unique) return uniq(headings);
  return headings;
}


function getRowsFromHeader(table) {
  let rows = [...table.tHead.rows];
  rows.splice(0, 1);
  return rows;
}

/**
 * given a table, generate an array of objects.
 * each object corresponds to a row in the table.
 * each object's key/value pairs correspond to a column's heading and the row's value for that column
 *
 * @param  {HTMLTableElement} table the table to convert
 * @return {Array<Object>}       array of objects representing each row in the table
 */
export function parseTable(table) {
  const headings = getHeadings(table);
  const allHeadings = getHeadings(table, false);

  if (headings.length === 0) return [];
  // some tables are misformated and only have a thead and no tbody
  const rows = table.tBodies[0]
    ? [...table.tBodies[0].rows]
    : table.tHead.rows.length > 1
      ? getRowsFromHeader(table)
      : [];
  // DDB often puts d rolls alongside each other. we attempt to detect these
  const lowResults = rows.map(mapRow(headings));
  const highResults = allHeadings.length !== headings.length
    ? rows.map(mapRow(headings, true))
    : [];

  return lowResults.concat(highResults);
}

