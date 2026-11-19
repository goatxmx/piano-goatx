import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../ui/icon/icon';
import { Button } from '../../ui/button/button';
import { SONGS } from '../../data/songs';

@Component({
  selector: 'app-free-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Button],
  templateUrl: './free-list.html',
  styleUrl: './free-list.scss',
})
export class FreeList {
  protected songs = SONGS;
}
