// components/assistant/KnowledgeGraph.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, Loader2 } from 'lucide-react';

interface KnowledgeGraphProps {
  items: any[];
  onNodeClick?: (item: any) => void;
  height?: number;
}

interface Node {
  id: string;
  name: string;
  type: string;
  group: number;
  size: number;
  color: string;
  val: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  items,
  onNodeClick,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!items.length || !svgRef.current) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Prepare nodes and links
    const nodes: Node[] = items.map((item, index) => ({
      id: item.id,
      name: item.title || item.content.substring(0, 30),
      type: item.type,
      group: index % 5,
      size: item.priority ? item.priority * 2 : 5,
      color: getColorForType(item.type),
      val: item.priority || 3,
    }));

    // Generate links based on shared tags or categories
    const links: Link[] = [];
    items.forEach((item, i) => {
      items.forEach((other, j) => {
        if (i >= j) return;

        // Connect if they share tags
        const sharedTags = item.tags?.filter((tag: string) => 
          other.tags?.includes(tag)
        ).length || 0;

        if (sharedTags > 0) {
          links.push({
            source: item.id,
            target: other.id,
            value: sharedTags,
          });
        }

        // Connect if same category
        if (item.category && item.category === other.category) {
          links.push({
            source: item.id,
            target: other.id,
            value: 0.5,
          });
        }
      });
    });

    // Setup SVG
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.attr('viewBox', [0, 0, width, height]);

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event:any) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom as any);

    // Create container group
    const g = svg.append('g');

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size * 2));

    // Add links
    const link = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d:any) => Math.sqrt(d.value));

    // Add nodes
    const node = g.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d:any) => d.size * 2)
      .attr('fill', (d:any) => d.color)
      .attr('cursor', 'pointer')
      .on('click', (event:any, d:any) => {
        event.stopPropagation();
        const clickedItem = items.find(item => item.id === d.id);
        if (clickedItem && onNodeClick) {
          onNodeClick(clickedItem);
        }
      })
      .on('mouseenter', function(event:any, d:any) {
        d3.select(this).attr('r', d.size * 3);
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.html(`
          <div class="p-2 bg-card border border-border rounded-lg shadow-lg">
            <strong>${d.name}</strong><br/>
            Type: ${d.type}<br/>
            ${d.size ? `Priority: ${d.size/2}/5` : ''}
          </div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseleave', function(event:any, d:any) {
        d3.select(this).attr('r', d.size * 2);
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add labels
    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d:any) => d.name)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4)
      .attr('fill', 'currentColor')
      .attr('cursor', 'pointer')
      .on('click', (event:any, d:any) => {
        event.stopPropagation();
        const clickedItem = items.find(item => item.id === d.id);
        if (clickedItem && onNodeClick) {
          onNodeClick(clickedItem);
        }
      });

    // Create tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('visibility', 'visible')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    setIsLoading(false);

    // Cleanup
    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [items]);

  const getColorForType = (type: string): string => {
    const colors: Record<string, string> = {
      'IDEA': '#f59e0b',
      'NOTE': '#3b82f6',
      'TODO': '#10b981',
      'PROJECT': '#8b5cf6',
      'QUESTION': '#f97316',
      'INSIGHT': '#ec4899',
      'THOUGHT': '#6b7280',
    };
    return colors[type] || '#6b7280';
  };

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().on('zoom', null); // Get current zoom
    svg.transition().call(zoom.scaleBy as any, 1.2);
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().on('zoom', null);
    svg.transition().call(zoom.scaleBy as any, 0.8);
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().on('zoom', null);
    svg.transition().call(zoom.transform as any, d3.zoomIdentity);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!items.length) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-2xl">🕸️</span>
          </div>
          <h3 className="font-medium mb-2">No Connections Yet</h3>
          <p className="text-sm text-muted-foreground">
            Add items to your Second Brain to see them visualized
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-1 shadow-lg">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-muted rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-muted rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 hover:bg-muted rounded-lg transition"
          title="Reset View"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-muted rounded-lg transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Zoom Indicator */}
      <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-sm">
        Zoom: {Math.round(zoomLevel * 100)}%
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
        <h4 className="text-xs font-semibold mb-2">Legend</h4>
        <div className="space-y-1">
          {[
            { type: 'IDEA', color: '#f59e0b' },
            { type: 'NOTE', color: '#3b82f6' },
            { type: 'TODO', color: '#10b981' },
            { type: 'PROJECT', color: '#8b5cf6' },
            { type: 'QUESTION', color: '#f97316' },
            { type: 'INSIGHT', color: '#ec4899' },
          ].map(item => (
            <div key={item.type} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="bg-card"
        style={{ cursor: 'grab' }}
      />
    </div>
  );
};