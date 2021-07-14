import { Component } from '@angular/core';
import { Task } from './task/task';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import {
  TaskDialogComponent,
  TaskDialogResult,
} from './task-dialog/task-dialog.component';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'kanban-angular';
  /*todo: Task[] = [
   {
   title: 'Card 1',
   description: 'Descrição do Card 1',
   },
   {
   title: 'Card 2',
   description: 'Descrição do Card 2',
   },
   ];
   inProgress: Task[] = [];
   done: Task[] = [];*/
  todo = this.store.collection('todo')
      .valueChanges({ idField: 'id' }) as Observable<Task[]>;
  inProgress = this.store.collection('inProgress')
      .valueChanges({ idField: 'id' }) as Observable<Task[]>;
  done = this.store.collection('done')
      .valueChanges({ idField: 'id' }) as Observable<Task[]>;

  constructor(
      private dialog: MatDialog,
      private store: AngularFirestore,
  ) {}

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
        .afterClosed()
        .subscribe((result: TaskDialogResult) => {
          if (!result) {
            return;
          }
          // this.todo.push(result.task);
          this.store.collection('todo').add(result.task);
        });
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    /*dialogRef.afterClosed().subscribe((result: TaskDialogResult) => {
      const dataList = this[list];
      const taskIndex = dataList.indexOf(task);
      if (result.delete) {
        dataList.splice(taskIndex, 1);
      } else {
        dataList[taskIndex] = task;
      }
    });*/
    dialogRef.afterClosed().subscribe((result: TaskDialogResult) => {
      if (result.delete) {
        this.store.collection(list).doc(task.id).delete();
      } else {
        this.store.collection(list).doc(task.id).update(task);
      }
    });
  }

  /*drop(event: CdkDragDrop<Task[]>): void {
   if (event.previousContainer === event.container) {
   return;
   }
   transferArrayItem(
   event.previousContainer.data,
   event.container.data,
   event.previousIndex,
   event.currentIndex,
   );
   }*/

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    this.store.firestore.runTransaction(() => {
      const promise = Promise.all([
        this.store.collection(event.previousContainer.id).doc(item.id).delete(),
        this.store.collection(event.container.id).add(item),
      ]);
      return promise;
    });
    transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
    );
  }
}
