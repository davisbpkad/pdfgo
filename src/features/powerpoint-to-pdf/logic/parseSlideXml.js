import { emuToPt } from './emuToPt.js';

/**
 * Parse presentation dimensions from presentation.xml
 * @param {string} xml
 * @returns {{ widthPt: number, heightPt: number }}
 */
export function parsePresentationDimensions(xml) {
  if (!xml || typeof xml !== 'string') {
    return { widthPt: 720, heightPt: 405 };
  }
  const match = xml.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/i);
  if (!match) return { widthPt: 720, heightPt: 405 };

  return {
    widthPt: emuToPt(parseInt(match[1], 10)) || 720,
    heightPt: emuToPt(parseInt(match[2], 10)) || 405
  };
}

/**
 * Parse relationship IDs to target file paths from slideN.xml.rels
 * @param {string} relsXml
 * @returns {Record<string, string>}
 */
export function parseSlideRels(relsXml) {
  const rels = {};
  if (!relsXml || typeof relsXml !== 'string') return rels;

  const matches = relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/gi);
  for (const m of matches) {
    const id = m[1];
    let target = m[2].replace(/^\.\.\//, 'ppt/');
    if (!target.startsWith('ppt/')) target = `ppt/${target}`;
    rels[id] = target;
  }
  return rels;
}

/**
 * Parse shapes, texts, and pictures from slideN.xml
 * @param {string} slideXml
 * @returns {Array<Object>}
 */
export function parseSlideElements(slideXml) {
  if (!slideXml || typeof slideXml !== 'string') return [];
  const elements = [];

  // 1. Parse text shapes & filled rectangles (<p:sp>)
  const spMatches = slideXml.matchAll(/<p:sp>([\s\S]*?)<\/p:sp>/gi);
  for (const m of spMatches) {
    const content = m[1];
    const off = content.match(/<a:off[^>]*x="(\d+)"[^>]*y="(\d+)"/i);
    const ext = content.match(/<a:ext[^>]*cx="(\d+)"[^>]*cy="(\d+)"/i);

    const xPt = off ? emuToPt(parseInt(off[1], 10)) : 0;
    const yPt = off ? emuToPt(parseInt(off[2], 10)) : 0;
    const widthPt = ext ? emuToPt(parseInt(ext[1], 10)) : 100;
    const heightPt = ext ? emuToPt(parseInt(ext[2], 10)) : 50;

    const fillMatch = content.match(/<a:solidFill><a:srgbClr[^>]*val="([A-Fa-f0-9]{6})"/i);
    const fillColor = fillMatch ? `#${fillMatch[1]}` : null;

    const textRuns = [];
    const rMatches = content.matchAll(/<a:r>([\s\S]*?)<\/a:r>/gi);
    for (const r of rMatches) {
      const rBody = r[1];
      const tMatch = rBody.match(/<a:t>([\s\S]*?)<\/a:t>/i);
      if (!tMatch) continue;

      const szMatch = rBody.match(/<a:rPr[^>]*sz="(\d+)"/i);
      const fontSize = szMatch ? Math.round(parseInt(szMatch[1], 10) / 100) : 14;
      const isBold = /<a:rPr[^>]*b="1"/i.test(rBody);
      const colorMatch = rBody.match(/<a:srgbClr[^>]*val="([A-Fa-f0-9]{6})"/i);

      textRuns.push({
        text: tMatch[1],
        fontSize,
        isBold,
        color: colorMatch ? `#${colorMatch[1]}` : '#000000'
      });
    }

    if (textRuns.length > 0 || fillColor) {
      elements.push({
        type: textRuns.length > 0 ? 'text' : 'shape',
        xPt, yPt, widthPt, heightPt,
        fillColor,
        textRuns
      });
    }
  }

  // 2. Parse pictures (<p:pic>)
  const picMatches = slideXml.matchAll(/<p:pic>([\s\S]*?)<\/p:pic>/gi);
  for (const p of picMatches) {
    const pBody = p[1];
    const off = pBody.match(/<a:off[^>]*x="(\d+)"[^>]*y="(\d+)"/i);
    const ext = pBody.match(/<a:ext[^>]*cx="(\d+)"[^>]*cy="(\d+)"/i);
    const blipMatch = pBody.match(/<a:blip[^>]*r:embed="([^"]+)"/i);

    elements.push({
      type: 'picture',
      xPt: off ? emuToPt(parseInt(off[1], 10)) : 0,
      yPt: off ? emuToPt(parseInt(off[2], 10)) : 0,
      widthPt: ext ? emuToPt(parseInt(ext[1], 10)) : 100,
      heightPt: ext ? emuToPt(parseInt(ext[2], 10)) : 100,
      relId: blipMatch ? blipMatch[1] : null
    });
  }

  return elements;
}
