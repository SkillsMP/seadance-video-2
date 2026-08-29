'use client';

import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';
import { Check, Sparkles } from 'lucide-react';

export interface ComparisonRow {
  feature: string;
  subtext?: string;
  values: string[];
  winner_index?: number;
}

export interface ComparisonCategory {
  category: string;
  items: ComparisonRow[];
}

export interface ComparisonTableProps {
  section: Section & {
    badge?: string;
    headers?: string[];
    highlight_column?: number;
    categories?: ComparisonCategory[];
    rows?: ComparisonRow[];
    takeaway?: {
      title?: string;
      description?: string;
      points?: string[];
    };
  };
  className?: string;
}

export function ComparisonTable({ section, className }: ComparisonTableProps) {
  const headers = section.headers || [];
  const categories = section.categories || (section.rows ? [{ category: '', items: section.rows }] : []);
  const highlightCol = section.highlight_column ?? 1;

  return (
    <section
      id={section.id || 'comparison-table'}
      className={cn('py-16 md:py-24', section.className, className)}
    >
      <div className="container space-y-10 md:space-y-14">
        {/* Header */}
        <ScrollAnimation>
          <div className="mx-auto max-w-4xl text-center">
            {section.badge && (
              <Badge variant="outline" className="mb-4 gap-1 px-3 py-1 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {section.badge}
              </Badge>
            )}
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground mx-auto max-w-2xl text-base md:text-lg">
                {section.description}
              </p>
            )}
          </div>
        </ScrollAnimation>

        {/* Table Container Card */}
        <ScrollAnimation delay={0.15}>
          <Card className="overflow-hidden border border-border/80 shadow-md">
            <CardContent className="p-0">
              <div className="relative w-full overflow-x-auto">
                <Table className="w-full text-left">
                  {headers.length > 0 && (
                    <TableHeader className="bg-muted/60 border-b border-border">
                      <TableRow className="hover:bg-transparent">
                        {headers.map((header, colIdx) => (
                          <TableHead
                            key={colIdx}
                            className={cn(
                              'py-4 px-4 sm:px-6 text-sm font-semibold whitespace-nowrap',
                              colIdx === 0 ? 'w-1/3 min-w-[200px] text-foreground' : 'min-w-[220px]',
                              colIdx === highlightCol
                                ? 'bg-primary/10 text-primary font-bold border-x border-primary/20'
                                : 'text-muted-foreground'
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              {colIdx === highlightCol && (
                                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4">
                                  Focus
                                </Badge>
                              )}
                              <span>{header}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                  )}

                  <TableBody className="divide-y divide-border">
                    {categories.map((cat, catIdx) => (
                      <React.Fragment key={catIdx}>
                        {cat.category && (
                          <TableRow className="bg-muted/40 hover:bg-muted/50 border-y border-border">
                            <TableCell
                              colSpan={headers.length || 3}
                              className="py-2.5 px-4 sm:px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                            >
                              {cat.category}
                            </TableCell>
                          </TableRow>
                        )}
                        {cat.items?.map((item, rowIdx) => (
                          <TableRow
                            key={`${catIdx}-${rowIdx}`}
                            className="transition-colors hover:bg-muted/20"
                          >
                            <TableCell className="py-4 px-4 sm:px-6 font-medium text-foreground align-top">
                              <div className="font-semibold text-sm">{item.feature}</div>
                              {item.subtext && (
                                <div className="text-xs text-muted-foreground mt-0.5 whitespace-normal">
                                  {item.subtext}
                                </div>
                              )}
                            </TableCell>
                            {item.values?.map((val, valIdx) => {
                              const isHighlighted = valIdx + 1 === highlightCol;
                              const isWinner = item.winner_index !== undefined && item.winner_index === valIdx;
                              return (
                                <TableCell
                                  key={valIdx}
                                  className={cn(
                                    'py-4 px-4 sm:px-6 text-sm align-top whitespace-normal',
                                    isHighlighted && 'bg-primary/[0.04] font-medium border-x border-primary/20',
                                    isWinner && 'text-foreground font-semibold'
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    {isWinner && (
                                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    )}
                                    <span>{val}</span>
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </ScrollAnimation>

        {/* Takeaway Box if provided */}
        {section.takeaway && (
          <ScrollAnimation delay={0.25}>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {section.takeaway.title || 'Architectural & Benchmark Takeaway'}
              </h3>
              {section.takeaway.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {section.takeaway.description}
                </p>
              )}
              {section.takeaway.points && section.takeaway.points.length > 0 && (
                <ul className="grid gap-2 sm:grid-cols-2 text-sm text-foreground">
                  {section.takeaway.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollAnimation>
        )}
      </div>
    </section>
  );
}
